import React from 'react';
import { useState, useEffect, useCallback } from "react";
import './App.css';

interface Customer {
  customerID: string;
  name: string;
  email: string;
}

function App() {
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allCustomerMessage, setAllCustomerMessage] = useState('');
  const [newCustomerMessage, setNewCustomerMessage] = useState('');
  const [inputId, setInputId] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    async function getAllCustomers() {
      const response = await fetch('/api/account/all');
      if (response.status === 200) {
        const allCustomers = await response.json();
        setAllCustomers(allCustomers);
        setAllCustomerMessage('');
      } else {
        setAllCustomerMessage('Fail to fetch all customers: ' + await response.text());
      }
    };

    getAllCustomers();
  }, [lastRefresh]);

  const createNewCustomer = useCallback(async () => {
    const body: Customer = {
      customerID: inputId,
      name: inputName,
      email: inputEmail
    };
    const response = await fetch('/api/account/create', { method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'Application/json' } })
    if (response.status === 200) {
      setLastRefresh(new Date());
      setNewCustomerMessage('Successfully created new customer');
    } else {
      setNewCustomerMessage('Fail to create new customer: ' + await response.text());
    }
  }, [inputId, inputEmail, inputName])

  return (
    <div className="App">
      <h1>Customer Details</h1>
      <p>{allCustomerMessage}</p>
      <p>{newCustomerMessage}</p>
      <label>
        ID: <input type="text" value={inputId} onChange={e => setInputId(e.target.value)} />
      </label>
      <label>
        Name: <input type="text" value={inputName} onChange={e => setInputName(e.target.value)} />
      </label>
      <label>
        Email: <input type="text" value={inputEmail} onChange={e => setInputEmail(e.target.value)} />
      </label>
      <input type="submit" value="Create" onClick={createNewCustomer} />
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {allCustomers.map(customer => {
            return (
              <tr key={customer.customerID}>
                <td>{customer.customerID}</td>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
