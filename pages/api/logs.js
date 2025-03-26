// pages/api/logs.js

import { getLogs } from "../../lib/logs";

export default function handler(req, res) {
  res.status(200).json({ logs: getLogs() });
}
