const MERCHANT_ALIASES = {
  subway: "Subway",
  swiggy: "Swiggy",
  zomato: "Zomato",
  mcdonald: "McDonald's",
  kfc: "KFC",
  dominos: "Domino's",

  uber: "Uber",
  ola: "Ola",
  rapido: "Rapido",

  amazon: "Amazon",
  flipkart: "Flipkart",
  myntra: "Myntra",

  netflix: "Netflix",
  spotify: "Spotify",
  "prime video": "Prime Video",
  youtube: "YouTube",

  airtel: "Airtel",
  jio: "Jio",

  apollo: "Apollo",
  pharmacy: "Pharmacy"
};

const resolveMerchant = (description) => {
  if (!description) {
    return "Unknown";
  }

  const text = description.toLowerCase().trim();

  for (const [alias, merchantName] of Object.entries(MERCHANT_ALIASES)) {
    if (text.includes(alias)) {
      return merchantName;
    }
  }

  return description.trim();
};

const resolveMerchants = (transactions) => {
  return transactions.map((transaction) => ({
    ...transaction,
    merchant: resolveMerchant(transaction.description)
  }));
};

module.exports = {
  resolveMerchant,
  resolveMerchants
};