import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/services/paymentService";
import axios from "axios";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      iconColor: "#6B7280", // Tailwind gray-500
      color: "#111827", // Tailwind gray-900
      fontSize: "16px",
      fontFamily: '"Inter", sans-serif',
      "::placeholder": {
        color: "#9CA3AF", // Tailwind gray-400
      },
      ":-webkit-autofill": {
        color: "#111827",
      },
    },
    invalid: {
      iconColor: "#EF4444", // Tailwind red-500
      color: "#B91C1C", // Tailwind red-700
    },
  },
};

interface StripeCheckoutFormProps {
  amount: number;
  currency?: string;
  userInfo: any;
  planInfo: any;
  onSuccess: () => void;
}

const StripeCheckoutForm = ({
  amount,
  currency = "EUR",
  userInfo: initialUserInfo,
  planInfo,
  onSuccess,
}: StripeCheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    if (
      !initialUserInfo?.firstName ||
      !initialUserInfo?.lastName ||
      !initialUserInfo?.email
    ) {
      setError("Compila nome, cognome e email.");
      return setProcessing(false);
    }
    if (!cardComplete) {
      setError("Compila i dati della carta.");
      return setProcessing(false);
    }

    const cardElement = elements?.getElement(CardElement);
    if (!stripe || !cardElement) {
      setError("Stripe non è ancora pronto.");
      return setProcessing(false);
    }

    // Create PaymentIntent
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "https://simplyai.it/api";
    const { clientSecret } = await (
      await fetch(`${API_BASE_URL}/stripe/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency }),
      })
    ).json();

    // Confirm payment
    const { error: stripeError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

    if (stripeError) {
      setError(stripeError.message || "Pagamento fallito.");
      return setProcessing(false);
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        const paymentInfo = { method: "Carta di Credito", amount };
        const { data } = await axios.post(
          `${API_BASE_URL}/payment/process-payment`,
          {
            userInfo: initialUserInfo,
            paymentInfo,
            planInfo,
          }
        );
        if (data.success) onSuccess();
        else setError(data.message || "Errore registrazione.");
      } catch (err: any) {
        setError(
          err.response?.data?.message || err.message || "Errore server."
        );
      }
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CardElement wrapper */}
      <div className="p-4 border border-gray-200 rounded-lg focus-within:border-purple-600 transition">
        <CardElement
          options={CARD_ELEMENT_OPTIONS}
          onChange={(e) => {
            setCardComplete(e.complete);
            if (error) setError(null);
          }}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full ${
          processing ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {processing
          ? "Elaborazione..."
          : `Paga ${formatCurrency(amount / 100, currency)}`}
      </Button>
    </form>
  );
};

export default StripeCheckoutForm;