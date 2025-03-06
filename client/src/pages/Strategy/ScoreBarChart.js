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
  scoredProcessorCount: "Proc",
  scoredNetCount: "Net",
  scoredOpponentProcessorCount: "O-Proc",
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

  // Compute the maximum value from the data
  const dataMax = data.reduce((max, item) => Math.max(max, item.value || 0), 0);
  // Round up to the nearest 0.25
  const adjustedMax = Math.ceil(dataMax / 0.25) * 0.25;
  // Generate ticks at 0.25 increments
  const ticks = [];
  for (let tick = 0; tick <= adjustedMax; tick += 0.25) {
    ticks.push(Number(tick.toFixed(2)));
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 5, left: 0, bottom: 5 }} // Reduced left margin
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, adjustedMax]} ticks={ticks} />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill={barColor} name="Count" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ScoreBarChart;
