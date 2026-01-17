"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent, Alert } from "@/components/ui";
import { CreditCard, MessageCircle, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface PaymentOptionsProps {
  bookingId: string;
  bookingCode: string;
  amount: number;
  customerName: string;
  packageTitle: string;
  whatsappNumber?: string;
}

const BANK_ACCOUNTS = [
  { bank: "BCA", accountNumber: "1234567890", accountName: "PT MeetAndGo Indonesia" },
  { bank: "Mandiri", accountNumber: "0987654321", accountName: "PT MeetAndGo Indonesia" },
  { bank: "BNI", accountNumber: "1122334455", accountName: "PT MeetAndGo Indonesia" },
];

const WHATSAPP_NUMBER = "6281234567890"; // Replace with actual number

export function PaymentOptions({
  bookingId,
  bookingCode,
  amount,
  customerName,
  packageTitle,
  whatsappNumber = WHATSAPP_NUMBER,
}: PaymentOptionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"gateway" | "manual" | null>(null);

  const handleMidtransPayment = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create payment");
      }

      const { redirectUrl } = await res.json();
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    setCheckingStatus(true);
    setError("");

    try {
      const res = await fetch("/api/payments/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to check status");
      }

      const data = await res.json();
      
      if (data.status === "PAYMENT_RECEIVED") {
        // Refresh the page to show updated status
        router.refresh();
      } else {
        setError("Payment not yet confirmed. Please wait a moment and try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check status");
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateWhatsAppMessage = () => {
    const message = `Halo Admin MeetAndGo,

Saya ingin konfirmasi pembayaran untuk booking:

📋 *Detail Booking*
- Kode Booking: ${bookingCode}
- Nama: ${customerName}
- Paket: ${packageTitle}
- Total: ${formatPrice(amount)}

Mohon diproses. Terima kasih!`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppConfirm = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${generateWhatsAppMessage()}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="text-center p-4 bg-emerald-50 rounded-lg">
        <p className="text-sm text-slate-600">Total Pembayaran</p>
        <p className="text-2xl font-bold text-emerald-600">{formatPrice(amount)}</p>
      </div>

      {/* Payment Method Selection */}
      {!selectedMethod && (
        <div className="grid gap-3">
          <button
            onClick={() => setSelectedMethod("gateway")}
            className="p-4 border-2 border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Payment Gateway</p>
                <p className="text-sm text-slate-500">Bayar via Kartu, E-Wallet, VA, dll</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedMethod("manual")}
            className="p-4 border-2 border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Transfer Manual</p>
                <p className="text-sm text-slate-500">Transfer bank & konfirmasi via WhatsApp</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Payment Gateway Option */}
      {selectedMethod === "gateway" && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Payment Gateway
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Bayar dengan berbagai metode: Kartu Kredit/Debit, GoPay, OVO, DANA, ShopeePay, Virtual Account, dan lainnya.
            </p>
            <Button onClick={handleMidtransPayment} loading={loading} className="w-full">
              <CreditCard className="w-4 h-4" />
              Bayar Sekarang
              <ExternalLink className="w-4 h-4" />
            </Button>
            
            {/* Check Payment Status Button */}
            <Button 
              onClick={checkPaymentStatus} 
              loading={checkingStatus} 
              variant="outline" 
              className="w-full"
            >
              <RefreshCw className="w-4 h-4" />
              Sudah Bayar? Cek Status
            </Button>
            
            <button
              onClick={() => setSelectedMethod(null)}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              ← Pilih metode lain
            </button>
          </CardContent>
        </Card>
      )}

      {/* Manual Transfer Option */}
      {selectedMethod === "manual" && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Transfer Manual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Transfer ke salah satu rekening:</p>
              {BANK_ACCOUNTS.map((account) => (
                <div
                  key={account.bank}
                  className="p-3 bg-slate-50 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{account.bank}</p>
                    <p className="text-sm text-slate-600">{account.accountNumber}</p>
                    <p className="text-xs text-slate-500">a.n. {account.accountName}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(account.accountNumber, account.bank)}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copied === account.bank ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Penting:</strong> Setelah transfer, konfirmasi pembayaran via WhatsApp dengan menyertakan bukti transfer.
              </p>
            </div>

            <Button 
              onClick={handleWhatsAppConfirm} 
              variant="outline" 
              className="w-full bg-green-50 border-green-500 text-green-700 hover:bg-green-100"
            >
              <MessageCircle className="w-4 h-4" />
              Konfirmasi via WhatsApp
            </Button>

            <button
              onClick={() => setSelectedMethod(null)}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              ← Pilih metode lain
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}