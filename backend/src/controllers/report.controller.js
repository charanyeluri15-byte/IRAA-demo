const Order = require('../models/Order');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Table = require('../models/Table');

const getDashboardStats = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

    // We only care about PAID and COMPLETED orders for revenue/profit
    const matchStage = {
      $match: {
        restaurantId,
        paymentStatus: 'PAID',
        status: 'COMPLETED'
      }
    };

    const statsPipeline = [
      matchStage,
      { $unwind: "$items" },
      {
        $lookup: {
          from: "menuitems",
          localField: "items.menuItemId",
          foreignField: "_id",
          as: "menuItemDetails"
        }
      },
      { $unwind: "$menuItemDetails" },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          dailySales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          dailyCost: { $sum: { $multiply: ["$menuItemDetails.costPrice", "$items.quantity"] } }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
             $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: "$_id.day"
             }
          },
          sales: "$dailySales",
          cost: "$dailyCost",
          profit: { $subtract: ["$dailySales", "$dailyCost"] }
        }
      },
      { $sort: { date: 1 } }
    ];

    const dailyStats = await Order.aggregate(statsPipeline);

    // Get Total Orders
    const totalOrdersCount = await Order.countDocuments({
      restaurantId,
      status: 'COMPLETED',
      paymentStatus: 'PAID'
    });

    // Best Selling Items
    const bestSellingPipeline = [
      matchStage,
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.menuItemId",
          name: { $first: "$items.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ];

    const bestSellingItems = await Order.aggregate(bestSellingPipeline);

    // Aggregate summary numbers
    let totalSales = 0;
    let totalProfit = 0;
    
    let monthlySales = 0;
    let monthlyProfit = 0;
    
    let weeklyProfit = 0;
    
    let todaySales = 0;
    let todayCost = 0;
    let todayProfit = 0;

    dailyStats.forEach(stat => {
      totalSales += stat.sales;
      totalProfit += stat.profit;
      
      const statDate = stat.date.getTime();
      
      if (statDate >= startOfMonth.getTime()) {
        monthlySales += stat.sales;
        monthlyProfit += stat.profit;
      }
      
      if (statDate >= startOfWeek.getTime()) {
        weeklyProfit += stat.profit;
      }
      
      if (statDate >= startOfDay.getTime()) {
        todaySales += stat.sales;
        todayCost += stat.cost;
        todayProfit += stat.profit;
      }
    });

    // Additional stats
    const startOfDayQuery = { restaurantId, createdAt: { $gte: startOfDay } };
    const todayOrders = await Order.find(startOfDayQuery);
    
    const pendingOrders = todayOrders.filter(o => ['PLACED', 'ACCEPTED'].includes(o.status)).length;
    const kitchenOrders = todayOrders.filter(o => o.status === 'PREPARING').length;
    const completedOrdersCount = todayOrders.filter(o => o.status === 'COMPLETED').length;
    const cancelledOrders = todayOrders.filter(o => o.status === 'CANCELLED').length;
    
    const todayExpensesList = await Expense.find({ restaurantId, expenseDate: { $gte: startOfDay } });
    const todayExpense = todayExpensesList.reduce((sum, exp) => sum + exp.amount, 0);
    
    const totalCustomers = await Customer.countDocuments({ restaurantId });
    const tablesOccupied = await Table.countDocuments({ restaurantId, status: 'OCCUPIED' });
    const tablesAvailable = await Table.countDocuments({ restaurantId, status: 'AVAILABLE' });
    
    const averageOrderValue = totalOrdersCount > 0 ? (totalSales / totalOrdersCount) : 0;

    res.json({
      totalSales,
      totalProfit,
      monthlySales,
      monthlyProfit,
      weeklyProfit,
      todaySales,
      todayCost,
      todayProfit,
      todayExpense,
      pendingOrders,
      kitchenOrders,
      completedOrders: completedOrdersCount,
      cancelledOrders,
      totalCustomers,
      averageOrderValue,
      tablesOccupied,
      tablesAvailable,
      totalOrders: totalOrdersCount,
      bestSellingItems,
      chartData: dailyStats.map(stat => ({
        date: stat.date.toISOString().split('T')[0],
        Sales: stat.sales,
        Profit: stat.profit
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
