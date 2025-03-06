import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const CoralBarChart = ({ coralData }) => {
  // Helper to extract the second element if the value is an array, otherwise return the value itself.
  const extractValue = (val) => (Array.isArray(val) ? val[0] : val);

  // Create a data array for the chart using the coral levels L1, L2, L3, and L4.
  const data = [
    { name: "L1", value: extractValue(coralData.L1) },
    { name: "L2", value: extractValue(coralData.L2) },
    { name: "L3", value: extractValue(coralData.L3) },
    { name: "L4", value: extractValue(coralData.L4) },
  ];

  return (
    <BarChart width={500} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis dataKey="value" />
      <Tooltip />
      <Legend />
      <Bar dataKey="value" fill="#8884d8" name="Value" />
    </BarChart>
  );
};

export default CoralBarChart;
