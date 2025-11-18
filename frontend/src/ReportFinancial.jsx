import React, { useState, useEffect, useContext } from "react";
import { Modal } from "./Modal";
import { utilsNx } from './utils.jsx';
import { AuthContext } from './AuthContext.jsx';

// Konstanta untuk filter tipe transaksi
const FILTER_TYPES = [
  { label: "All", value: "all" },
  { label: "Income", value: "income" },
  { label: "Expense", value: "expense" }
];

// Konstanta untuk kategori
const CATEGORIES = [
  { value: "", label: "All" },
  { value: "salary", label: "Salary" },
  { value: "side_job" , label: "Side Job", },
  { value: "bonus", label: "Bonus" },
  { value: "honorarium", label: "Honorarium " },
  { value: "snacks", label: "Snacks" },
  { value: "foods_drinks", label: "Foods & Drinks" },
  { value: "shopping", label: "Shopping" },
  { value: "other", label: "Other" }
];

// Komponen untuk menampilkan ikon transaksi
const TransactionIcon = () => (
  <svg
    className="w-6 h-6 text-black"
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
      d="M8 17.345a4.76 4.76 0 0 0 2.558 1.618c2.274.589 4.512-.446 4.999-2.31.487-1.866-1.273-3.9-3.546-4.49-2.273-.59-4.034-2.623-3.547-4.488.486-1.865 2.724-2.899 4.998-2.31.982.236 1.87.793 2.538 1.592m-3.879 12.171V21m0-18v2.2"
    />
  </svg>
);

// Komponen untuk item transaksi
const TransactionItem = ({ tx, convertCurrency }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center">
      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
        <TransactionIcon />
      </div>
      <div>
        <p className="font-medium text-black">{tx.category}</p>
        <p className="text-sm text-gray-500">{tx.date.split(" ")[0]}</p>
      </div>
    </div>
    <p className={`font-bold ${tx.is_income ? "text-green-500" : "text-red-500"}`}>
      {convertCurrency(tx.amount)}
    </p>
  </div>
);

export function ReportFinancial() {
  const { 
    getReportByMonth, 
    getFilteredTransactions 
  } = utilsNx();

  const { 
    transactions, 
    reportBalances, 
    reportIncome, 
    reportExpense, 
    setTransactions, 
    monthReport, 
    setMonthReport, 
    convertCurrency, 
    activeReportFilter, 
    setActiveReportFilter 
  } = useContext(AuthContext);

  // State hooks
  const [isOpenAllTx, setIsOpenAllTx] = useState(false);
  const [filterTx, setFilterTx] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('');
  const [txHistory, setTxHistory] = useState([]);

  // Inisialisasi bulan default
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonthHistory, setSelectedMonthHistory] = useState(defaultMonth);

  // Fungsi untuk mengubah bulan laporan
  const changeMonth = async (month) => {
    try {
      setMonthReport(month);
      const report = await getReportByMonth(month);
      setTransactions(report.Ok || []);
    } catch (error) {
      console.error('Error changing month:', error);
    }
  };

  // Fungsi untuk filter transaksi
  const handleFilterChange = async () => {
    try {
      const filtered = await getFilteredTransactions(filterTx, filterCategory, selectedMonthHistory);
      setTxHistory(filtered.Ok || []);
    } catch (error) {
      console.error('Error fetching filtered transactions:', error);
    }
  };

  // Effect untuk memuat transaksi terfilter
  useEffect(() => {
    if (isOpenAllTx) {
      handleFilterChange();
    }
  }, [isOpenAllTx, filterTx, filterCategory, selectedMonthHistory]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Report Financial</h1>

      {/* Kontrol filter bulan dan tipe transaksi */}
      <div className="sm:flex justify-between items-center mb-2 w-full">
        <div className="mb-2 sm:mb-0">
          <label className="text-base">
            Month:
            <input
              type="month"
              className="bg-transparent ml-4 w-[160px] outline-none"
              value={monthReport}
              onChange={(e) => changeMonth(e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-3 bg-gray-200 rounded-full p-1 w-full sm:w-fit">
          {FILTER_TYPES.map(({ label, value }) => (
            <button
              key={value}
              className={`px-4 py-2 rounded-full transition ${
                activeReportFilter === value ? "bg-teal-800 text-white" : "text-gray-700"
              }`}
              onClick={() => setActiveReportFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Layout utama laporan */}
      <div className="md:grid grid-cols-12 gap-4">
        {/* Daftar Transaksi */}
        <div className="bg-white rounded-3xl p-6 shadow-md col-span-8 mb-2 md:mb-0">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-black">Transactions</h3>
            <button
              onClick={() => setIsOpenAllTx(true)}
              className="flex items-center text-sm text-gray-600 hover:underline"
            >
              <span>View All</span>
            </button>
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-6">
              {transactions.map((tx) => (
                <TransactionItem 
                  key={tx.id} 
                  tx={tx} 
                  convertCurrency={convertCurrency} 
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No transactions recorded</p>
          )}
        </div>

        {/* Ringkasan Keuangan */}
        <div className="bg-white rounded-3xl p-6 shadow-md col-span-4">
          <div className="flex items-center border-b border-gray-300 pb-4 mb-4">
            <div className="w-10 h-10 bg-[#FFCA28] rounded-full flex items-center justify-center mr-4">
              <TransactionIcon />
            </div>
            <div>
              <p className="text-sm">Remaining Balance</p>
              <p className="text-xl font-bold">{convertCurrency(reportBalances)}</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between">
              Total Income{" "}
              <span className="text-[#0EB200]">+{convertCurrency(reportIncome)}</span>
            </div>
            <div className="flex justify-between">
              Total Expense{" "}
              <span className="text-[#B20000]">-{convertCurrency(reportExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Riwayat Transaksi */}
      <Modal
        isOpen={isOpenAllTx}
        onClose={() => setIsOpenAllTx(false)}
        title="History Transaction"
      >
        {/* Kontrol filter dalam modal */}
        <div className="block sm:flex mb-3">
          <div className="mb-2 sm:mb-0">
            <select
              value={filterTx}
              onChange={(e) => setFilterTx(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg mr-2 w-full sm:w-[120px] p-2"
            >
              <option value="ALL">All</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>

          <div className="mb-2 sm:mb-0">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg mr-2 w-full sm:w-[120px] p-2"
            >
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <input
              type="month"
              className="bg-gray-50 border border-gray-300 text-sm outline-none rounded-lg w-full sm:w-[160px] p-2"
              value={selectedMonthHistory}
              onChange={(e) => setSelectedMonthHistory(e.target.value)}
            />
          </div>
        </div>

        {/* Daftar Transaksi dalam Modal */}
        <div className="bg-white rounded-3xl p-6 shadow-md col-span-8 mb-2 md:mb-0">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-black">Transactions</h3>
          </div>

          {txHistory.length > 0 ? (
            <div className="space-y-6 max-h-[350px] overflow-y-auto">
              {txHistory.map((tx) => (
                <TransactionItem 
                  key={tx.id} 
                  tx={tx} 
                  convertCurrency={convertCurrency} 
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No transactions recorded</p>
          )}
        </div>
      </Modal>
    </div>
  );
}