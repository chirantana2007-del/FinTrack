const CATEGORY_RULES = {
  Food: [
    "swiggy",
    "zomato",
    "mcdonald",
    "kfc",
    "subway",
    "dominos",
    "restaurant",
    "cafe",
    "coffee"
  ],

  Transport: [
    "uber",
    "ola",
    "rapido",
    "metro",
    "petrol",
    "fuel",
    "shell",
    "parking"
  ],

  Shopping: [
    "amazon",
    "flipkart",
    "myntra",
    "walmart",
    "target",
    "mall",
    "store"
  ],

  Entertainment: [
    "netflix",
    "spotify",
    "prime video",
    "youtube",
    "movie",
    "cinema"
  ],

  Bills: [
    "electricity",
    "water bill",
    "internet",
    "wifi",
    "phone bill",
    "airtel",
    "jio"
  ],

  Health: [
    "pharmacy",
    "medical",
    "hospital",
    "apollo",
    "clinic"
  ],

  Education: [
    "college",
    "university",
    "course",
    "udemy",
    "coursera"
  ]
};

const categorizeTransaction = (description) => {
  if (!description) {
    return "Other";
  }

  const text = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return "Other";
};

const categorizeTransactions = (transactions) => {
  return transactions.map((transaction) => ({
    ...transaction,
    category: categorizeTransaction(transaction.description)
  }));
};

module.exports = {
  categorizeTransaction,
  categorizeTransactions
};