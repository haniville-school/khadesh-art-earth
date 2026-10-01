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
  commissionPercent: number; // e.g. 10 means platform keeps 10%
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

/**
 * Creates a Paystack subaccount for a vendor. Paystack's
 * `percentage_charge` on a subaccount is the share the SUBACCOUNT
 * (vendor) receives, so we pass (100 - commissionPercent).
 */
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

/**
 * Resolves an account number to a name before submission, so vendors
 * can confirm the account is theirs before you create the subaccount.
 */
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

/** List Nigerian banks (for populating a bank-select dropdown). */
export async function listBanks() {
  const res = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
    headers: paystackHeaders(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Could not fetch bank list");
  }
  return json.data as { name: string; code: string }[];
}