let trafficLogs = []; // 与proxy.js共享存储

export default async (req, res) => {
  if (req.method === 'GET') {
    // 返回最近100条记录
    return res.json({
      success: true,
      data: trafficLogs.slice(-100).reverse()
    });
  }
  
  return res.status(405).json({ 
    success: false,
    error: 'Method not allowed' 
  });
};
