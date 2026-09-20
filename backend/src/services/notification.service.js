const createNotification = (type, message, data = {}) => {
  return {
    type,
    message,
    data,
    created_at: new Date().toISOString()
  };
};

const createSubscriptionNotification = (merchant, amount) => {
  return createNotification(
    "subscription",
    `${merchant} subscription detected`,
    {
      merchant,
      amount
    }
  );
};

const createBudgetNotification = (category, percentage) => {
  return createNotification(
    "budget",
    `You have used ${percentage}% of your ${category} budget`,
    {
      category,
      percentage
    }
  );
};

const createAnomalyNotification = (description, amount) => {
  return createNotification(
    "anomaly",
    `Unusual transaction detected: ${description}`,
    {
      description,
      amount
    }
  );
};

module.exports = {
  createNotification,
  createSubscriptionNotification,
  createBudgetNotification,
  createAnomalyNotification
};