import React, { useState, useEffect, useContext } from 'react';
import { AddTransaction } from './AddTransaction.jsx';
import { utilsNx } from './utils.jsx';
import { ReportFinancial } from "./ReportFinancial";
import { AuthContext } from './AuthContext.jsx';
import { AiAdvice } from './AiAdvice.jsx'

const App = () => {
  const { updateProfile, getProfile, getBalance, getIncome, getExpense } = utilsNx();
  const { mainBalances, mainIncome, mainExpense, setMainBalances, setMainIncome, setMainExpense, monthMain, setMonthMain, currency, setCurrency, convertCurrency } = useContext(AuthContext); 

  const [isOpenRecordTx, setIsOpenRecordTx] = useState(false);
  const [isOpenAiAdvice, setIsOpenAiAdvice] = useState(false);

  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
  // const [selectedMonthMain, setSelectedMonthMain] = useState(defaultMonth);

  const changeMonth = async (month) => {
    console.log('month change 1: ', month);
    setMonthMain(month);
    console.log('month change: 2', monthMain);
    const balance = await getBalance(month);
    const income = await getIncome(month);
    const expense = await getExpense(month);
    console.log('balance change: ', balance.Ok);
    console.log('income change: ', income.Ok);
    console.log('expense change: ', expense.Ok);
    setMainBalances(balance.Ok);
    setMainIncome(income.Ok);
    setMainExpense(expense.Ok);
  }

  return (
    <div>
      <div className="bg-[url('/bg-main.svg')] bg-cover text-white">
        <div className="max-w-screen-xl mx-auto p-8 sm:p-14 bg-cover flex flex-col items-center justify-center">

          <span className="mb-1 text-base">Expense</span>
          <label className="mb-1 text-base">
            Month :
            <input
              type="month"
              className="bg-transparent ml-4 w-[160px] outline-none dark:[color-scheme:dark]"
              value={monthMain}
              onChange={(e) => changeMonth(e.target.value)}
            />
          </label>

          <div className="flex mb-4 items-end">
            <h1 className="text-3xl sm:text-5xl">{convertCurrency(mainExpense)}</h1>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              id="currency"
              className="text-sm rounded-lg h-[30px] bg-transparent cursor-pointer outline-none"
            >
              <option className="text-black" value="idr">
                IDR
              </option>
              <option className="text-black" value="usd">
                USD
              </option>
            </select>
          </div>

          <div className="sm:grid grid-cols-2 gap-4 mb-4">
            <div className="bg-black/20 rounded-xl p-4 flex items-center mb-4 sm:mb-0">
              <div className="w-10 h-10 bg-[#0eb200] rounded-full flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 origin-center rotate-45"
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
                    d="M19 12H5m14 0-4 4m4-4-4-4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm">Income</p>
                <p className="text-xl font-bold">{convertCurrency(mainIncome)}</p>
              </div>
            </div>
            <div className="bg-black/20 rounded-xl p-4 flex items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-4">
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
              </div>
              <div>
                <p className="text-sm">Remaining Balance</p>
                <p className="text-xl font-bold">{convertCurrency(mainBalances)}</p>
              </div>
            </div>
          </div>

          <div className="sm:grid grid-cols-2 gap-4">
            <div className="mb-4 sm:mb-0">
              <button
                onClick={() => setIsOpenRecordTx(true)}
                type="button"
                className="text-white bg-[#FF0000] hover:bg-[#bf0101] focus:outline-none font-medium rounded-lg text-sm px-4 py-2 text-center"
              >
                Record Transaction
              </button>
            </div>
            <div>
              <button
                onClick={() => setIsOpenAiAdvice(true)}
                type="button"
                className="text-white bg-[#AD00FF] hover:bg-[#8109ba] focus:outline-none font-medium rounded-lg text-sm px-4 py-2 text-center w-full sm:w-auto"
              >
                AI Advice
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-screen-xl mx-auto p-4 text-black">
        <ReportFinancial />
      </div>

      {/* Modal */}
      <AddTransaction isOpen={isOpenRecordTx} onClose={() => setIsOpenRecordTx(false)}/>
      <AiAdvice isOpen={isOpenAiAdvice} onClose={() => setIsOpenAiAdvice(false)}/>
    </div>
  );
};

export default App;
