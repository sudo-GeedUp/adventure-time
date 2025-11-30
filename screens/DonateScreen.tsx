import React, { useState } from "react";
const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  dollar: "",     // $1 - "Just a Dollar" tier
  coffee: "",     // $5 - "Coffee" tier  
  snack: "",      // $10 - "Trail Snack" tier
  lunch: "",      // $20 - "Trail Lunch" tier
  custom: "https://buy.stripe.com/bJeaEX4Gfe5Z8Ah4fbfMA00", // Variable amount - Enable "Let customer choose price" in Stripe
};

const DONATION_TIERS = [
  {
    id: "dollar",
    amount: 1,
    icon: "dollar-sign" as const,
    label: "Just a Dollar",
    description: "Every bit helps",
  },
  {
    id: "coffee",
    amount: 5,
    icon: "coffee" as const,
    label: "Coffee",
    description: "Buy the team a coffee",
  },
  {
    id: "snack",
    amount: 10,
    icon: "droplet" as const,
    label: "Trail Snack",
    description: "Help with small improvements",
  },
  {
    id: "lunch",
    amount: 20,
    icon: "sun" as const,
    label: "Trail Lunch",
    description: "Support trail maintenance",
  },
];
