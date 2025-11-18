import { useState } from "react";
import { AuthClient } from '@dfinity/auth-client';
import { createActor } from 'declarations/backend'; // Impor dari icp.ninja atau dfx generate
import { canisterId } from 'declarations/backend/index.js'; // Impor canisterId

const network = process.env.DFX_NETWORK || 'ic'; // Default ke mainnet kalau nggak ada env
const identityProvider =
  network === 'ic'
    ? 'https://identity.ic0.app' // Mainnet
    : `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`; // Local

let authClient = null;
let actor = null;

export function utilsNx() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

    // Inisialisasi autentikasi dan actor
  const init = async () => {
    await updateActor();
  };

  // Update actor berdasarkan autentikasi
  const updateActor = async () => {
    if (!authClient) {
      authClient = await AuthClient.create();
    }
    const identity = authClient.getIdentity();
    actor = createActor(canisterId, {
      agentOptions: { identity },
    });
    const isAuthenticated = await authClient.isAuthenticated();
    console.log('is authenticated', isAuthenticated);
    setIsLoggedIn(isAuthenticated)
    console.log('auth now', isLoggedIn);
    // return isAuthenticated;
  };

  // Login dengan Internet Identity
  const login = async () => {
    console.log('click login', authClient);
    if (!authClient) {
      authClient = await AuthClient.create();
    }
    await authClient.login({
      identityProvider,
      onSuccess: async () => {
        await updateActor();
        setIsLoggedIn(true);
      },
    });
  };

  // Logout dari Internet Identity
  const logout = async () => {
    console.log('click logout', authClient);
    if (authClient) {
      await authClient.logout();
      await updateActor();
      setIsLoggedIn(false); // Update actor jadi anonim setelah logout
    }
  };

  // Cek apakah user sudah autentikasi
  const isAuthenticated = async () => {
    if (!authClient) return false;
    return await authClient.isAuthenticated();
  };

  // Fungsi untuk update profil
  const updateProfile = async (name) => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    return await actor.update_profile(name);
  };

  // Fungsi untuk mendapatkan profil
  const getProfile = async () => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    return await actor.get_profile();
  };

  // Fungsi untuk menambah transaksi (bulk)
  const addTransaction = async (amounts, descriptions, categories, isIncomes, timestamps) => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    // Konversi timestamps ke BigInt untuk Candid
    const timestampsBigInt = timestamps.map(ts => BigInt(ts));
    return await actor.add_transaction(amounts, descriptions, categories, isIncomes, timestampsBigInt);
  };

  // Fungsi untuk menambah income (bulk)
  const addIncome = async (amounts, descriptions, categories, timestamps) => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    const isIncomes = Array(amounts.length).fill(true);
    const timestampsStr = timestamps.map(ts => BigInt(ts).toString());
    return await actor.add_income(amounts, descriptions, categories, timestampsStr);
  };

  // Fungsi untuk menambah expense (bulk)
  const addExpense = async (amounts, descriptions, categories, timestamps) => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    const isIncomes = Array(amounts.length).fill(false);
    const timestampsStr = timestamps.map(ts => BigInt(ts).toString());
    return await actor.add_expense(amounts, descriptions, categories, timestampsStr);
  };

  // Fungsi untuk mendapatkan conversion rate USD ke IDR
  const getUsdToIdrConversionRate = async () => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    return await actor.get_usd_to_idr_conversion_rate();
  };

  // Fungsi untuk mendapatkan laporan transaksi
  const getReport = async () => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    return await actor.get_report();
  };

  // Fungsi untuk mendapatkan laporan transaksi berdasarkan bulan
  const getReportByMonth = async (yearMonth) => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    return await actor.get_report_by_month(yearMonth);
  };

  // Fungsi untuk mendapatkan laporan hanya income
  const getIncomeReport = async (yearMonth = '') => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    return await actor.get_income_report(yearMonth);
  };

  // Fungsi untuk mendapatkan laporan hanya expense
  const getExpenseReport = async (yearMonth = '') => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    return await actor.get_expense_report(yearMonth);
  };

  // Fungsi untuk mendapatkan saldo
  const getBalance = async (month) => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    return await actor.get_balance(month);
  };

  const getIncome = async (month) => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    return await actor.get_income(month);
  };

  const getExpense = async (month) => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    return await actor.get_expense(month);
  };

  // Fungsi untuk mendapatkan analisis
  const getAnalysis = async () => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    return await actor.get_analysis();
  };

  // Fungsi untuk mendapatkan saran keuangan
  const getAIAdvice = async (totalIncome, totalExpenses, balance) => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    return await actor.get_ai_advice(totalIncome, totalExpenses, balance);
  };

  const getFilteredTransactions = async (transactionType, category, yearMonth) => {
    if (!actor) throw new Error('Not authenticated. Please login first.');
    return await actor.get_filtered_transactions(transactionType, category, yearMonth);
  };

  return {
    init,
    login,
    logout,
    isAuthenticated,
    updateProfile,
    updateActor,
    getProfile,
    addTransaction,
    addIncome,
    addExpense,
    getReport,
    getBalance,
    getIncome,
    getExpense,
    getAnalysis,
    getAIAdvice,
    getReportByMonth,
    getIncomeReport,
    getExpenseReport,
    getUsdToIdrConversionRate,
    isLoggedIn,
    isAuth,
    getFilteredTransactions
  };
}