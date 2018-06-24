import React from 'react';
import ReactDOM from 'react-dom';
import headers from './headers';
import data from './data';
import Excel from './Excel';
import './table.css';

ReactDOM.render(
  <Excel headers={headers} initialData={data} />,
  document.getElementById("root")
);
