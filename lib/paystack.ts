const PAYSTACK_BASE_URL = "https://api.paystack.co";

function paystackHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

type CreateSubaccountParams = {
  storeName: string;
  bankCode: string;
  accountNumber: string;
  commissionPercent: number;
};

type PaystackSubaccountResponse = {
  status: boolean;
  message: string;
  data?: {
    subaccount_code: string;
    account_number: string;
    account_name: string;
  };
};

export async function createPaystackSubaccount(
  params: CreateSubaccountParams
): Promise<PaystackSubaccountResponse> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/subaccount`, {
    method: "POST",
    headers: paystackHeaders(),
    body: JSON.stringify({
      business_name: params.storeName,
      bank_code: params.bankCode,
      account_number: params.accountNumber,
      percentage_charge: 100 - params.commissionPercent,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to create Paystack subaccount");
  }
  return json;
}

export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string
) {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    { headers: paystackHeaders() }
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Could not resolve account number");
  }
  return json.data as { account_number: string; account_name: string };
}

export { calculateTransactionFee } from "@/lib/fees";

type SplitSubaccount = {
  subaccount: string;
  share: number;
};

type InitializeTransactionParams = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  subaccounts: SplitSubaccount[];
  metadata?: Record<string, unknown>;
};

export async function initializeTransaction(params: InitializeTransactionParams) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: paystackHeaders(),
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      split: {
        type: "flat",
        bearer_type: "account",
        subaccounts: params.subaccounts,
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to initialize transaction");
  }
  return json.data as { authorization_url: string; access_code: string; reference: string };
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    headers: paystackHeaders(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Could not verify transaction");
  }
  return json.data as { status: string; reference: string; amount: number };
}

export function verifyPaystackSignature(rawBody: string, signatureHeader: string | null) {
  if (!signatureHeader) return false;
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");
  return hash === signatureHeader;
}

export async function listBanks() {
  const res = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria&type=nuban`, {
    headers: paystackHeaders(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Could not fetch bank list");
  }

  const banks = json.data as { id: number; name: string; code: string }[];

  const seen = new Set<string>();
  return banks.filter((bank) => {
    if (seen.has(bank.code)) return false;
    seen.add(bank.code);
    return true;
  });
}