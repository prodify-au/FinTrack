import React, { useState, useEffect, useContext } from 'react';
import { Modal } from "./Modal";
import { utilsNx } from './utils.jsx';
import { AuthContext } from './AuthContext.jsx';

export function AiAdvice({ isOpen, onClose }){
  const { getAIAdvice } = utilsNx();
  const { currency, reportBalances, reportIncome, reportExpense, convertCurrency } = useContext(AuthContext);
  const [valueAdvice, setValueAdvice] = useState("Loading...");

  const handleAiAdvice = async () => {
    try {
      const advice = await getAIAdvice(convertCurrency(reportIncome), convertCurrency(reportExpense), convertCurrency(reportBalances));
      console.log('advice: ', advice.Ok);
      setValueAdvice(advice.Ok)
    } catch (error) {
      console.error('Get ai advice failed:', error);
    }
  }

  useEffect(() => {
    if(isOpen){
      setValueAdvice("Loading...");
      handleAiAdvice();
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Advice">
      <div>
        <textarea
          value={valueAdvice}
          rows="20"
          class="block p-2.5 w-full text-sm text-gray-900 bg-gray-200 rounded-lg focus:outline-none"
          readOnly
        ></textarea>
      </div>
    </Modal>
  );

}