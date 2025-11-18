use candid::{CandidType, Principal};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
    TransformContext,
};
use ic_cdk::{update, query};
use ic_cdk_macros::*;
use serde::{Deserialize, Serialize};
use serde_json;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    storable::Bound,
    DefaultMemoryImpl, StableBTreeMap, Storable,
};
use std::borrow::Cow;
use std::cell::RefCell;
use ic_llm::{Model, prompt};

#[derive(CandidType, Serialize, Deserialize, Clone)]
struct Transaction {
    id: u64,
    amount: f64,
    description: String,
    is_income: bool,
    timestamp: u64,
    date: String, // Format: "YYYY-MM-DD HH:MM:SS"
    category: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Default)]
struct UserData {
    transactions: Vec<Transaction>,
    next_tx_id: u64,
    balance: f64,
}

impl Storable for UserData {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_json::to_vec(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        serde_json::from_slice(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = 
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    
    static USERS: RefCell<StableBTreeMap<Principal, UserData, Memory>> = RefCell::new({
        let memory = MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)));
        StableBTreeMap::init(memory)
    });
}

#[init]
fn init() {}

fn caller() -> Principal {
    ic_cdk::caller()
}

fn timestamp_to_date(timestamp_ns: u64) -> String {
    let timestamp_s = timestamp_ns / 1_000_000_000;
    let seconds_since_epoch = timestamp_s % 86400;
    let days_since_epoch = timestamp_s / 86400;

    let mut year = 1970;
    let mut days = days_since_epoch;
    while days >= 365 {
        let year_days = if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) { 366 } else { 365 };
        if days >= year_days {
            days -= year_days;
            year += 1;
        } else {
            break;
        }
    }

    let mut month = 1;
    let days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let is_leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    while days >= days_in_month[month - 1] as u64 || (month == 2 && is_leap && days >= 29) {
        let month_days = if month == 2 && is_leap { 29 } else { days_in_month[month - 1] };
        days -= month_days as u64;
        month += 1;
    }

    let day = days + 1;
    let hour = seconds_since_epoch / 3600;
    let minute = (seconds_since_epoch % 3600) / 60;
    let second = seconds_since_epoch % 60;

    format!(
        "{:04}-{:02}-{:02} {:02}:{:02}:{:02}",
        year, month, day, hour, minute, second
    )
}

fn get_year_month(timestamp_ns: u64) -> String {
    let timestamp_s = timestamp_ns / 1_000_000_000;
    let days_since_epoch = timestamp_s / 86400;

    let mut year = 1970;
    let mut days = days_since_epoch;
    while days >= 365 {
        let year_days = if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) { 366 } else { 365 };
        if days >= year_days {
            days -= year_days;
            year += 1;
        } else {
            break;
        }
    }

    let mut month = 1;
    let days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let is_leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    while days >= days_in_month[month - 1] as u64 || (month == 2 && is_leap && days >= 29) {
        let month_days = if month == 2 && is_leap { 29 } else { days_in_month[month - 1] };
        days -= month_days as u64;
        month += 1;
    }

    format!("{:04}-{:02}", year, month)
}

#[update]
async fn add_transaction(
    amounts: Vec<f64>,
    descriptions: Vec<String>,
    categories: Vec<String>,
    is_incomes: Vec<bool>,
    timestamps: Vec<u64>,
) -> Result<String, String> {
    let user = caller();
    if user == Principal::anonymous() {
        return Err("Please log in with Internet Identity".to_string());
    }

    let len = amounts.len();
    if len != descriptions.len() || len != categories.len() || len != is_incomes.len() || len != timestamps.len() {
        return Err("All input arrays must have the same length".to_string());
    }

    if len == 0 {
        return Err("No transactions provided".to_string());
    }

    USERS.with(|users| {
        let mut users = users.borrow_mut();
        let mut user_data = users.get(&user).unwrap_or_default();
        
        for i in 0..len {
            let date = timestamp_to_date(timestamps[i]);
            let tx = Transaction {
                id: user_data.next_tx_id,
                amount: amounts[i],
                description: descriptions[i].clone(),
                is_income: is_incomes[i],
                timestamp: timestamps[i],
                date,
                category: categories[i].clone(),
            };
            user_data.transactions.push(tx);
            if is_incomes[i] {
                user_data.balance += amounts[i];
            } else {
                user_data.balance -= amounts[i];
            }
            user_data.next_tx_id += 1;
        }
        
        users.insert(user, user_data);
        Ok(format!("Added {} transactions successfully", len))
    })
}

#[update]
async fn add_income(
    amounts: Vec<f64>,
    descriptions: Vec<String>,
    categories: Vec<String>,
    timestamps: Vec<u64>,
) -> Result<String, String> {
    let is_incomes = vec![true; amounts.len()];
    add_transaction(amounts, descriptions, categories, is_incomes, timestamps).await
}

#[update]
async fn add_expense(
    amounts: Vec<f64>,
    descriptions: Vec<String>,
    categories: Vec<String>,
    timestamps: Vec<u64>,
) -> Result<String, String> {
    let is_incomes = vec![false; amounts.len()];
    add_transaction(amounts, descriptions, categories, is_incomes, timestamps).await
}

#[query]
fn get_filtered_transactions(
    transaction_type: String, // "ALL", "INCOME", "EXPENSE"
    category: String,        // Kategori, kosongkan untuk semua kategori
    year_month: String,      // Format "YYYY-MM", kosongkan untuk semua bulan
) -> Result<Vec<Transaction>, String> {
    let user = caller();
    if user == Principal::anonymous() {
        return Err("Please log in with Internet Identity".to_string());
    }

    USERS.with(|users| {
        let users = users.borrow();
        let user_data = users.get(&user).unwrap_or_default(); // Default ke UserData kosong
        
        let filtered_transactions: Vec<Transaction> = user_data.transactions.iter()
            .filter(|tx| {
                // Filter berdasarkan tipe transaksi
                let type_match = match transaction_type.as_str() {
                    "ALL" => true,
                    "INCOME" => tx.is_income,
                    "EXPENSE" => !tx.is_income,
                    _ => false, // Invalid type
                };
                
                // Filter berdasarkan kategori
                let category_match = category.is_empty() || tx.category == category;
                
                // Filter berdasarkan bulan
                let month_match = year_month.is_empty() || get_year_month(tx.timestamp) == year_month;
                
                type_match && category_match && month_match
            })
            .cloned()
            .collect();
        
        Ok(filtered_transactions)
    })
}

#[query]
fn get_income(year_month: String) -> Result<f64, String> {
    let user = caller();
    if user == Principal::anonymous() {
        return Err("Please log in with Internet Identity".to_string());
    }
    USERS.with(|users| {
        let users = users.borrow();
        let user_data = users.get(&user).unwrap_or_default(); // Default ke UserData kosong
        let total_income = if year_month.is_empty() {
            user_data.transactions.iter()
                .filter(|tx| tx.is_income)
                .map(|tx| tx.amount)
                .sum()
        } else {
            user_data.transactions.iter()
                .filter(|tx| tx.is_income && get_year_month(tx.timestamp) == year_month)
                .map(|tx| tx.amount)
                .sum()
        };
        // Normalkan -0.0 menjadi +0.0
        let total_income = if total_income == 0.0 { 0.0 } else { total_income };
        Ok(total_income)
    })
}

#[query]
fn get_expense(year_month: String) -> Result<f64, String> {
    let user = caller();
    if user == Principal::anonymous() {
        return Err("Please log in with Internet Identity".to_string());
    }
    USERS.with(|users| {
        let users = users.borrow();
        let user_data = users.get(&user).unwrap_or_default(); // Default ke UserData kosong
        let total_expense = if year_month.is_empty() {
            user_data.transactions.iter()
                .filter(|tx| !tx.is_income)
                .map(|tx| tx.amount)
                .sum()
        } else {
            user_data.transactions.iter()
                .filter(|tx| !tx.is_income && get_year_month(tx.timestamp) == year_month)
                .map(|tx| tx.amount)
                .sum()
        };
        // Normalkan -0.0 menjadi +0.0
        let total_expense = if total_expense == 0.0 { 0.0 } else { total_expense };
        Ok(total_expense)
    })
}

#[query]
fn get_balance(year_month: String) -> Result<f64, String> {
    let user = caller();
    if user == Principal::anonymous() {
        return Err("Please log in with Internet Identity".to_string());
    }
    USERS.with(|users| {
        let users = users.borrow();
        let user_data = users.get(&user).unwrap_or_default(); // Default ke UserData kosong
        if year_month.is_empty() {
            Ok(user_data.balance)
        } else {
            let total_income: f64 = user_data.transactions.iter()
                .filter(|tx| tx.is_income && get_year_month(tx.timestamp) == year_month)
                .map(|tx| tx.amount)
                .sum();
            let total_expense: f64 = user_data.transactions.iter()
                .filter(|tx| !tx.is_income && get_year_month(tx.timestamp) == year_month)
                .map(|tx| tx.amount)
                .sum();
            Ok(total_income - total_expense)
        }
    })
}

#[update]
async fn get_usd_to_idr_conversion_rate() -> Result<f64, String> {
    let user = caller();
    if user == Principal::anonymous() {
        return Err("Please log in with Internet Identity".to_string());
    }

    let api_key = "853b59383a78a1317d14da03";
    let host = "v6.exchangerate-api.com";
    let url = format!("https://{}/v6/{}/pair/USD/IDR", host, api_key);

    let request_headers = vec![HttpHeader {
        name: "User-Agent".to_string(),
        value: "icp_exchange_rate.canister".to_string(),
    }];

    let request = CanisterHttpRequestArgument {
        url,
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(2000),
        transform: Some(TransformContext::from_name("transform".to_string(), vec![])),
        headers: request_headers,
    };

    match http_request(request, 4_706_800).await {
        Ok((response,)) => {
            let str_body = String::from_utf8(response.body)
                .map_err(|_| "Failed to decode response body".to_string())?;
            let json: serde_json::Value = serde_json::from_str(&str_body)
                .map_err(|_| "Failed to parse JSON".to_string())?;
            let rate = json["conversion_rate"]
                .as_f64()
                .ok_or("No conversion_rate in response".to_string())?;
            Ok(rate)
        }
        Err((code, msg)) => Err(format!("HTTP request failed. Code: {:?}, Msg: {}", code, msg)),
    }
}

#[query]
fn transform(raw: TransformArgs) -> HttpResponse {
    HttpResponse {
        status: raw.response.status,
        body: raw.response.body,
        headers: vec![],
    }
}

#[query]
fn get_report() -> Result<Vec<Transaction>, String> {
    let user = caller();
    if user == Principal::anonymous() {
        return Err("Please log in with Internet Identity".to_string());
    }
    USERS.with(|users| {
        let users = users.borrow();
        let user_data = users.get(&user).unwrap_or_default(); // Default ke UserData kosong
        Ok(user_data.transactions.clone())
    })
}

#[query]
fn get_report_by_month(year_month: String) -> Result<Vec<Transaction>, String> {
    let user = caller();
    if user == Principal::anonymous() {
        return Err("Please log in with Internet Identity".to_string());
    }
    USERS.with(|users| {
        let users = users.borrow();
        let user_data = users.get(&user).unwrap_or_default(); // Default ke UserData kosong
        let filtered_transactions: Vec<Transaction> = user_data
            .transactions
            .iter()
            .filter(|tx| get_year_month(tx.timestamp) == year_month)
            .cloned()
            .collect();
        Ok(filtered_transactions)
    })
}

#[query]
fn get_income_report(year_month: String) -> Result<Vec<Transaction>, String> {
    let user = caller();
    if user == Principal::anonymous() {
        return Err("Please log in with Internet Identity".to_string());
    }
    USERS.with(|users| {
        let users = users.borrow();
        let user_data = users.get(&user).unwrap_or_default(); // Default ke UserData kosong
        let filtered_transactions: Vec<Transaction> = user_data
            .transactions
            .iter()
            .filter(|tx| {
                // Filter berdasarkan tipe income
                let is_income_match = tx.is_income;
                // Filter berdasarkan bulan (jika year_month tidak kosong)
                let month_match = year_month.is_empty() || get_year_month(tx.timestamp) == year_month;
                is_income_match && month_match
            })
            .cloned()
            .collect();
        Ok(filtered_transactions)
    })
}

#[query]
fn get_expense_report(year_month: String) -> Result<Vec<Transaction>, String> {
    let user = caller();
    if user == Principal::anonymous() {
        return Err("Please log in with Internet Identity".to_string());
    }
    USERS.with(|users| {
        let users = users.borrow();
        let user_data = users.get(&user).unwrap_or_default(); // Default ke UserData kosong
        let filtered_transactions: Vec<Transaction> = user_data
            .transactions
            .iter()
            .filter(|tx| {
                // Filter berdasarkan tipe expense
                let is_expense_match = !tx.is_income;
                // Filter berdasarkan bulan (jika year_month tidak kosong)
                let month_match = year_month.is_empty() || get_year_month(tx.timestamp) == year_month;
                is_expense_match && month_match
            })
            .cloned()
            .collect();
        Ok(filtered_transactions)
    })
}

#[query]
fn get_analysis() -> Result<(f64, f64), String> {
    let user = caller();
    if user == Principal::anonymous() {
        return Err("Please log in with Internet Identity".to_string());
    }
    USERS.with(|users| {
        let users = users.borrow();
        let user_data = users.get(&user).unwrap_or_default(); // Default ke UserData kosong
        let mut income = 0.0;
        let mut expenses = 0.0;
        for tx in &user_data.transactions {
            if tx.is_income {
                income += tx.amount;
            } else {
                expenses += tx.amount;
            }
        }
        Ok((income, expenses))
    })
}

#[update]
async fn get_ai_advice(
    total_income: String,
    total_expenses: String,
    balance: String,
) -> Result<String, String> {
    let user = caller();
    if user == Principal::anonymous() {
        return Err("Please log in with Internet Identity".to_string());
    }

    // Buat prompt dengan nilai dari frontend, tanpa top_category
    let prompt_text = format!(
        "User has total income {} and total expenses {}. Current balance: {}. Provide specific financial advice.",
        total_income, total_expenses, balance
    );

    ic_cdk::println!("Prompt: {}", prompt_text); // Logging untuk debugging

    let response = prompt(Model::Llama3_1_8B, &prompt_text).await;
    if response.is_empty() {
        Err("No advice available due to AI error".to_string())
    } else {
        Ok(response)
    }
}

ic_cdk::export_candid!();