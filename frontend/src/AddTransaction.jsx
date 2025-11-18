import React, { useState, useEffect, useContext } from 'react';
import { utilsNx } from './utils.jsx';
import { Modal } from "./Modal";
import { AuthContext } from './AuthContext.jsx';

const categories = [
  { label: "Salary", value: "salary" },
  { label: "Side Job", value: "side_job" },
  { label: "Bonus", value: "bonus" },
  { label: "Honorarium ", value: "honorarium" },
  { label: "Snacks", value: "snacks" },
  { label: "Shopping", value: "shopping" },
  { label: "Foods & Drinks", value: "foods_drinks" },
  { label: "Other", value: "other" },
];

export function AddTransaction({ isOpen, onClose }) {
  const { addTransaction, getBalance, getIncome, getExpense, getReportByMonth } = utilsNx();
  const { mainBalances, mainIncome, mainExpense, transactions, reportBalances, reportIncome, reportExpense, setMainBalances, setMainIncome, setMainExpense, setTransactions, setReportBalances, setReportExpense, setReportIncome, monthMain, monthReport, currency, convertCurrency, exchangeRate, setActiveReportFilter } = useContext(AuthContext);  // Ambil saldo dari AuthContext

  const [tx, setTx] = useState([]);
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // Format YYYY-MM-DD
  };
  const [formData, setFormData] = useState({
    type: false, // Default ke "expense"
    date: getTodayDate(),
    amount: "",
    description: "",
    category: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount") {
      if (/^\d*$/.test(value)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value === "" ? "" : Number(value),
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCategorySelect = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleTypeSelect = (type) => {
    setFormData((prev) => ({ ...prev, type }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.date ||
      !formData.amount ||
      !formData.description ||
      !formData.category
    ) {
      alert("All fields must be filled!");
      return;
    }

    const newTransaction = { ...formData };
    setTx([...tx, newTransaction]);

    setFormData({
      type: false,
      date: getTodayDate(),
      amount: "",
      description: "",
      category: "",
    });
  };

  const deleteTransaction = (index) => {
    setTx(tx.filter((_, i) => i !== index));
  };

  const recordTransactions = async () => {
    if (tx.length === 0) {
      alert("No transactions to record!");
      return;
    }

    console.log("Recorded Transactions:", tx);
    try {
      const amounts = tx.map(data => currency === "idr" ? Number(data.amount) : Number(data.amount) * exchangeRate);
      const descriptions = tx.map(data => data.description);
      const categories = tx.map(data => data.category);
      const isIncomes = tx.map(data => data.type);
      const timestamps = tx.map(data => Math.floor(new Date(data.date).getTime() * 1e6)); // Nanodetik
      console.log("Transactions amount:", amounts);
      console.log("Transactions descriptions:", descriptions);
      console.log("Transactions categories:", categories);
      console.log("Transactions isIncomes:", isIncomes);
      console.log("Transactions timestamps:", timestamps);

      const result = await addTransaction(amounts, descriptions, categories, isIncomes, timestamps);
      console.log("Transactions Submitted:", result);
      alert("Transactions Submitted");
      setTx([]);
      onClose();
      const balance = await getBalance(monthMain);
      const income = await getIncome(monthMain);
      const expense = await getExpense(monthMain);
      const balanceReport = await getBalance("");
      const incomeReport = await getIncome("");
      const expenseReport = await getExpense("");
      const report = await getReportByMonth(monthReport);
      console.log('balance change: ', balance.Ok);
      console.log('income change: ', income.Ok);
      console.log('expense change: ', expense.Ok);
      console.log('balance change: ', balanceReport.Ok);
      console.log('income change: ', incomeReport.Ok);
      console.log('expense change: ', expenseReport.Ok);
      console.log('report change: ', report);
      setMainBalances(balance.Ok);
      setMainIncome(income.Ok);
      setMainExpense(expense.Ok);
      setReportBalances(balanceReport.Ok);
      setReportIncome(incomeReport.Ok);
      setReportExpense(expenseReport.Ok);
      setTransactions(report.Ok || []);
      setActiveReportFilter("all");
    } catch (error) {
      console.error('Error submitting transactions:', error);
    }
  };

  const filteredCategories = categories.filter(({ value }) => 
    formData.type ? ["salary", "other", "side_job", "bonus", "honorarium"].includes(value) : ["snacks", "shopping", "foods_drinks", "other"].includes(value)
  );

  useEffect(() => {
    if (!isOpen) {
      setTx([]); // Reset tx ketika modal ditutup
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Transaction">
      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Buttons for Expense & Income */}
        <div className="flex justify-center mb-3">
          {[
            { label: "Expense", value: false },
            { label: "Income", value: true },
          ].map(({ label, value }) => (
            <button
              key={value}
              type="button"
              className={`px-4 py-2 rounded-full transition inline-flex items-center mx-2 border
                    ${
                      formData.type === value
                        ? value === true
                          ? "bg-[#0fb20017] border-[#0EB200]"
                          : "bg-[#ff00001c] border-[#FF0000]"
                        : "bg-transparent text-black border-gray-400"
                    }`}
              onClick={() => handleTypeSelect(value)}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center mr-4 ${
                  value ? "bg-[#0eb200]" : "bg-[#FF0000]"
                }`}
              >
                <svg
                  className="w-4 h-4 origin-center rotate-45"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  width="24"
                  height="24"
                  style={{
                    filter:
                      "brightness(0) saturate(100%) invert(100%) sepia(1%) saturate(0%) hue-rotate(77deg) brightness(101%) contrast(101%)",
                  }}
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={
                      value
                        ? "M5 12h14M5 12l4-4m-4 4 4 4"
                        : "M19 12H5m14 0-4 4m4-4-4-4"
                    }
                  />
                </svg>
              </div>
              {label}
            </button>
          ))}
        </div>

        {/* Date Input */}
        <div className="text-center mb-3">
          <label className="mb-3 text-base">
            Date:
            <input
              type="date"
              name="date"
              className="bg-transparent ml-4 w-[130px] outline-none"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        {/* Amount Input */}
        <div className="mb-3">
          <div className="flex items-center rounded-full bg-[#d9e6e8] px-6 py-2 text-center text-xl font-medium">
            <span className="mr-2">{currency === "idr" ? "Rp" : "$"}</span>
            <input
              type="number"
              name="amount"
              className="w-full bg-transparent text-center focus:outline-none"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0"
              required
            />
          </div>
        </div>

        {/* Description Input */}
        <div className="mb-3">
          <input
            type="text"
            name="description"
            placeholder="Description"
            className="w-full rounded-full border border-gray-200 px-6 py-2 focus:border-primary focus:outline-none"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        {/* Categories */}
        <div className="mb-3 rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map(({ label, value }) => (
              <button
                type="button"
                key={value}
                className={`rounded-full border px-4 py-2 transition ${
                  formData.category === value
                    ? "bg-blue-500 text-white border-blue-500"
                    : "border-gray-200"
                }`}
                onClick={() => handleCategorySelect(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="text-center mb-3">
          <button
            type="submit"
            className="text-white bg-[#0EB200] hover:bg-[#0f9104] focus:outline-none font-medium rounded-lg text-sm px-4 py-2"
          >
            Add Item
          </button>
        </div>
      </form>

      {/* Transaction List */}
      {tx.length > 0 && (
        <div className="mt-4 border-t pt-3">
          {tx.map((tx, index) => {
            const categoryData = categories.find(
              (c) => c.value === tx.category
            );
            return (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b"
              >
                <div className="flex items-center">
                  <span className="text-gray-700">
                    {categoryData?.label || "Unknown"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="bg-gray-100 text-blue-600 px-3 py-1 rounded-full">
                    {currency === "idr" ? `Rp. ${Number(tx.amount).toLocaleString("id-ID")}` : `$ ${tx.amount.toFixed(2)}`}
                  </span>
                  <button
                    className="ml-3 text-red-500"
                    onClick={() => deleteTransaction(index)}
                  >
                    <svg
                      className="w-6 h-6 text-gray-800"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Button */}
      <div className="text-center mt-3">
        <button
          type="button"
          className="text-white bg-[#FF0000] hover:bg-[#bf0101] focus:outline-none font-medium rounded-lg text-sm px-4 py-2 text-center"
          onClick={recordTransactions}
        >
          Record Transaction
        </button>
      </div>
    </Modal>
  );
}