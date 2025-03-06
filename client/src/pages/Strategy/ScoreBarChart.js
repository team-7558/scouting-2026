import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const CHART_KEY_LABELS = {
  scoredProcessorCount: "Processor",
  scoredNetCount: "Net",
  scoredOpponentProcessorCount: "Opponent Processor",
};

const ScoreBarChart = ({
  scoreData,
  chartKeys,
  height = 300,
  barColor = "#8884d8",
}) => {
  // If the value is an array, take the second element
  const extractValue = (val) => (Array.isArray(val) ? val[1] : val);

  // Build the chart data based on the provided keys
  const data = chartKeys.map((key) => ({
    name: CHART_KEY_LABELS[key] || key,
    value: extractValue(scoreData[key]),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill={barColor} name="Count" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ScoreBarChart;
