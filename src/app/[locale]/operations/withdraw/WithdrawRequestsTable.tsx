"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  approveWithdrawalAction,
  rejectWithdrawalAction,
  type WithdrawalRequest,
} from "./actions";
import styles from "./withdraw.module.scss";

type Feedback = {
  type: "success" | "error";
  message: string;
};

interface WithdrawalTableProps {
  requests: WithdrawalRequest[];
}

function formatAmount(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

const statusTone: Record<string, { label: string; tone: string }> = {
  transferred: { label: "Approved", tone: "success" },
  approved: { label: "Approved", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  rejected: { label: "Rejected", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "warning" },
};

export default function WithdrawRequestsTable({ requests }: WithdrawalTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, Feedback>>({});
  const [, startTransition] = useTransition();
  const [operatorName, setOperatorName] = useState("Operator");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("crm_user_name");
    if (stored) {
      setOperatorName(stored);
    }
  }, []);

  const handleApprove = async (formData: FormData) => {
    const id = Number(formData.get("withdrawId"));
    setPendingId(id);
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    let result;
    try {
      result = await approveWithdrawalAction(formData);
    } catch (error) {
      setFeedback((prev) => ({
        ...prev,
        [id]: {
          type: "error",
          message:
            error instanceof Error ? error.message : "Approval failed unexpectedly",
        },
      }));
      setPendingId(null);
      return;
    }

    if (result?.success) {
      setFeedback((prev) => ({
        ...prev,
        [id]: { type: "success", message: "Approved" },
      }));
      startTransition(() => router.refresh());
    } else {
      setFeedback((prev) => ({
        ...prev,
        [id]: {
          type: "error",
          message: result?.error || "Approval failed",
        },
      }));
    }

    setPendingId(null);
  };

  const handleReject = async (formData: FormData) => {
    const id = Number(formData.get("withdrawId"));
    setPendingId(id);
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    let result;
    try {
      result = await rejectWithdrawalAction(formData);
    } catch (error) {
      setFeedback((prev) => ({
        ...prev,
        [id]: {
          type: "error",
          message:
            error instanceof Error ? error.message : "Rejection failed unexpectedly",
        },
      }));
      setPendingId(null);
      return;
    }

    if (result?.success) {
      setFeedback((prev) => ({
        ...prev,
        [id]: { type: "success", message: "Refunded & Rejected" },
      }));
      startTransition(() => router.refresh());
    } else {
      setFeedback((prev) => ({
        ...prev,
        [id]: {
          type: "error",
          message: result?.error || "Rejection failed",
        },
      }));
    }

    setPendingId(null);
  };

  return (
    <div className={styles.tableShell}>
      {requests.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="ri-inbox-line" aria-hidden />
          <div>
            <strong>No withdrawal requests yet</strong>
            <p>New submissions will appear here.</p>
          </div>
        </div>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.requestsTable}>
            <thead>
              <tr>
                <th className={styles.min}>Request</th>
                <th>Account</th>
                <th className={styles.tight}>Balances</th>
                <th className={styles.tight}>Payment</th>
                <th className={styles.min}>Status</th>
                <th className={styles.min}>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const statusKey = (req.status || "").toLowerCase();
                const tone = statusTone[statusKey] || statusTone.pending;
                const isApproved = statusKey === "transferred" || statusKey === "approved";
                const isRejected = statusKey === "rejected";
                const isCancelled = statusKey === "cancelled";
                const isResolved = isApproved || isRejected || isCancelled;
                const feedbackMsg = feedback[req.id];

                return (
                  <tr key={req.id}>
                    <td>
                      <span className={styles.main}>#{req.id}</span>
                    </td>
                    <td>
                      <div className={styles.stack}>
                        <div className={styles.main}>
                          {req.login || "—"}
                          {req.amount !== null && (
                            <span className={styles.amount}>
                              {formatAmount(req.amount)} {req.currency || "USD"}
                            </span>
                          )}
                        </div>
                        <div className={styles.sub}>
                          {req.clientName || <span className={styles.muted}>Client</span>}
                        </div>
                        <div className={styles.sub}>
                          {req.comment ? (
                            <span title={req.comment}>{req.comment}</span>
                          ) : (
                            <span className={styles.muted}>No comment yet</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={styles.balancesCell}>
                      <div className={styles.stack}>
                        <div className={styles.main}>
                          Bal {formatAmount(req.balance)} · Eq {formatAmount(req.equity)}
                        </div>
                        <div className={styles.sub}>
                          Mar {formatAmount(req.margin)} · Free {formatAmount(req.marginFree)}
                        </div>
                        <div className={styles.sub}>
                          Lv {formatAmount(req.marginLevel)}% · Cr {formatAmount(req.credit)}
                        </div>
                      </div>
                    </td>
                    <td className={styles.paymentCell}>
                      <div className={`${styles.stack} ${styles.paymentStack}`}>
                        <div className={styles.main}>
                          {req.paymentMethod || req.bankName || "—"}
                        </div>
                        <div className={styles.sub}>
                          {req.bankNumber ||
                            req.walletAddress ||
                            req.usdtType ||
                            "—"}
                        </div>
                      </div>
                    </td>
                    <td className={styles.statusCell}>
                      <div className={`${styles.pill} ${styles[`pill-${tone.tone}`]}`}>
                        {tone.label}
                      </div>
                      {req.deal && (
                        <div className={`${styles.sub} ${styles.muted} ${styles.nowrap}`}>
                          Deal #{req.deal}
                        </div>
                      )}
                      {req.cancelWithdrawDeal && (
                        <div className={`${styles.sub} ${styles.muted} ${styles.nowrap}`}>
                          Refund #{req.cancelWithdrawDeal}
                        </div>
                      )}
                      <div className={`${styles.sub} ${styles.muted} ${styles.nowrap}`}>
                        Updated {formatDate(req.updateTime)}
                      </div>
                    </td>
                    <td>
                      <form
                        className={styles.actionForm}
                        onSubmit={(event) => {
                          event.preventDefault();
                          const formData = new FormData(event.currentTarget);
                          const target = (event.nativeEvent as SubmitEvent)
                            .submitter as HTMLButtonElement | null;
                          const intent = target?.value === "reject" ? "reject" : "approve";
                          if (intent === "approve") {
                            void handleApprove(formData);
                          } else {
                            void handleReject(formData);
                          }
                        }}
                      >
                        <input type="hidden" name="withdrawId" value={req.id} />
                        <input type="hidden" name="operator" value={operatorName} />
                        <input
                          type="text"
                          name="comment"
                          className={styles.commentInput}
                          defaultValue={
                            isRejected
                              ? req.comment || "ADJ_RejectWithdraw"
                              : req.comment || "Approved"
                          }
                          placeholder="Comment"
                          aria-label="Comment"
                          readOnly={isResolved}
                          disabled={isResolved}
                        />
                        <div className={styles.actionsRow}>
                          <button
                            type="submit"
                          value="approve"
                          className="btn btn-primary btn-sm btn-expanded-sm"
                          disabled={pendingId === req.id || isResolved}
                        >
                          {pendingId === req.id
                            ? "Processing..."
                            : isApproved
                            ? "Approved"
                            : "Approve"}
                          </button>
                          <button
                            type="submit"
                          value="reject"
                          className="btn btn-danger btn-sm btn-outline"
                          disabled={pendingId === req.id || isResolved}
                        >
                          {pendingId === req.id ? "Processing..." : "Reject"}
                        </button>
                        </div>
                      </form>
                      {feedbackMsg && (
                        <div
                          className={`${styles.feedback} ${
                            styles[`feedback-${feedbackMsg.type}`]
                          }`}
                        >
                          {feedbackMsg.message}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
