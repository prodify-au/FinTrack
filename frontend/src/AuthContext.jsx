import React, { createContext, useState, useEffect } from "react";
import { utilsNx } from "./utils.jsx";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { getBalance, getIncome, getExpense, getProfile, isAuthenticated, login, logout, isLoggedIn, getReportByMonth, getUsdToIdrConversionRate, getIncomeReport, getExpenseReport, updateActor } = utilsNx();
  const [mainBalances, setMainBalances] = useState(0);
  const [mainIncome, setMainIncome] = useState(0);
  const [mainExpense, setMainExpense] = useState(0);
  const [reportBalances, setReportBalances] = useState(0);
  const [reportIncome, setReportIncome] = useState(0);
  const [reportExpense, setReportExpense] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [activeReportFilter, setActiveReportFilter] = useState("all");

  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
  const [monthMain, setMonthMain] = useState(defaultMonth);
  const [monthReport, setMonthReport] = useState(defaultMonth);
  
  const [currency, setCurrency] = useState("idr");
  const [exchangeRate, setExchangeRate] = useState(null);

  const handleCurrency = async () => {
    const rate = await getUsdToIdrConversionRate();
    console.log('rate now: ', rate);
    setExchangeRate(rate.Ok);
    console.log('rate now 2: ', exchangeRate);
  }

  useEffect(() => {
    updateActor();
  }, []);

  useEffect(() => {
    console.log('isloggedin: ', isLoggedIn);
    if (isLoggedIn) {
      console.log("User is logged in, fetching balances...");
      handleCurrency();
      handleGetMainBalances(monthMain);
      handleGetMainIncome(monthMain);
      handleGetMainExpense(monthMain);
      handleGetReportByMonth(monthReport);
      handleGetReportBalances("");
      handleGetReportIncome("");
      handleGetReportExpense("");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      if (activeReportFilter == 'all') {
        handleGetReportByMonth(monthReport);
      } else if (activeReportFilter == 'income'){
        handleGetReportIncomeByMonth(monthReport)
      } else {
        handleGetReportExpenseByMonth(monthReport);
      }
    };
  }, [activeReportFilter]);

  const convertCurrency = (price) => {
    if (currency === "idr") return `Rp. ${price.toLocaleString("id-ID")}`;
    if (!exchangeRate) return "Loading...";
    const priceUSD = (price / exchangeRate).toFixed(2);
    return `$ ${priceUSD}`;
  };

  const handleLogin = async () => {
    await login();
    // handleGetBalances();
  };

  const handleLogout = async () => {
    await logout();
    // setIsLoggedIn(false);
    setMainBalances(0);
    setMainIncome(0);
    setMainExpense(0);
    setTransactions([]);
  };

  const handleGetMainBalances = async (month) => {
    const balances = await getBalance(month);
    console.log('balance now: ', balances);
    setMainBalances(balances.Ok);
  };

  const handleGetMainIncome = async (month) => {
    const balances = await getIncome(month);
    console.log('income now: ', balances);
    setMainIncome(balances.Ok);
  };

  const handleGetMainExpense = async (month) => {
    const balances = await getExpense(month);
    console.log('expense now: ', balances);
    setMainExpense(balances.Ok);
  };

  const handleGetReportBalances = async (month) => {
    const balances = await getBalance(month);
    console.log('balance now: ', balances);
    setReportBalances(balances.Ok);
  };

  const handleGetReportIncome = async (month) => {
    const balances = await getIncome(month);
    console.log('income now: ', balances);
    setReportIncome(balances.Ok);
  };

  const handleGetReportExpense = async (month) => {
    const balances = await getExpense(month);
    console.log('expense now: ', balances);
    setReportExpense(balances.Ok);
  };

  const handleGetReportByMonth = async (month) => {
    try {
      const report = await getReportByMonth(month);
      console.log('report: ', report);
      setTransactions(report.Ok || []);
    } catch (error) {
      console.error('Error getting report by month:', error);
    }
  };

  const handleGetReportIncomeByMonth = async (month) => {
    try {
      const report = await getIncomeReport(month);
      console.log('report income by month: ', report);
      setTransactions(report.Ok || []);
    } catch (error) {
      console.error('Error getting report by month:', error);
    }
  }

  const handleGetReportExpenseByMonth = async (month) => {
    try {
      const report = await getExpenseReport(month);
      console.log('report expense by month: ', report);
      setTransactions(report.Ok || []);
    } catch (error) {
      console.error('Error getting report by month:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, handleLogin, handleLogout, mainBalances, mainIncome, mainExpense, transactions, reportBalances, reportIncome, reportExpense, setMainBalances, setMainIncome, setMainExpense, setTransactions, setReportBalances, setReportExpense, setReportIncome, monthMain, setMonthMain, monthReport, setMonthReport, currency, setCurrency, convertCurrency, exchangeRate, activeReportFilter, setActiveReportFilter }}>
      {children}
    </AuthContext.Provider>
  );
};
