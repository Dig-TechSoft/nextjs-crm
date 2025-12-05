"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  approveDepositAction,
  rejectDepositAction,
  type DepositRequest,
} from "./actions";
import styles from "./deposit.module.scss";

type Feedback = {
  type: "success" | "error";
  message: string;
};

interface DepositRequestsTableProps {
  requests: DepositRequest[];
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

function getReceiptUrl(uploadCode: string | null) {
  if (!uploadCode) return null;
  const trimmed = uploadCode.trim();
  if (!trimmed) return null;
  const filename = trimmed.includes(".") ? trimmed : `${trimmed}.png`;
  return `/deposit_receipt/${encodeURIComponent(filename)}`;
}

const statusTone: Record<string, { label: string; tone: string }> = {
  approved: { label: "Approved", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  rejected: { label: "Rejected", tone: "danger" },
};

export default function DepositRequestsTable({
  requests,
}: DepositRequestsTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, Feedback>>({});
  const [preview, setPreview] = useState<{
    src: string;
    title: string;
  } | null>(null);
  const [, startTransition] = useTransition();

  const handleApprove = async (formData: FormData) => {
    const id = Number(formData.get("receiptId"));
    setPendingId(id);
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    let result;
    try {
      result = await approveDepositAction(formData);
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
        [id]: {
          type: "success",
          message: `Ticket #${result.ticket} saved`,
        },
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
    const id = Number(formData.get("receiptId"));
    setPendingId(id);
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    let result;
    try {
      result = await rejectDepositAction(formData);
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
        [id]: {
          type: "success",
          message: "Request rejected",
        },
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
    <>
      <div className={styles.tableShell}>
        {requests.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="ri-inbox-line" aria-hidden />
            <div>
              <strong>No deposit requests yet</strong>
              <p>New uploads will appear here instantly.</p>
            </div>
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.requestsTable}>
              <thead>
                <tr>
                  <th className={styles.min}>Request</th>
                  <th>Account</th>
                  <th className={styles.tight}>Payment</th>
                  <th className={styles.min}>Receipt</th>
                  <th>Status</th>
                  <th className={styles.min}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const isApproved =
                    (req.status || "").toLowerCase() === "approved";
                  const isRejected =
                    (req.status || "").toLowerCase() === "rejected";
                  const isResolved = isApproved || isRejected;
                  const receiptUrl = getReceiptUrl(req.uploadCode);
                  const toneKey = (req.status || "").toLowerCase();
                  const tone = statusTone[toneKey] || statusTone.pending;
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
                                {formatAmount(req.amount)} USD
                              </span>
                            )}
                          </div>
                          <div className={styles.sub}>
                            {req.comment ? (
                              <span title={req.comment}>{req.comment}</span>
                            ) : (
                              <span className={styles.muted}>
                                No comment yet
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={styles.paymentCell}>
                        <div
                          className={`${styles.stack} ${styles.paymentStack}`}
                        >
                          <div className={styles.main}>
                            {req.paymentMethod || "—"}
                          </div>
                          <div className={`${styles.sub} ${styles.truncate}`}>
                            {req.usdtType ? `${req.usdtType} · ` : ""}
                            {req.walletAddress || "—"}
                          </div>
                        </div>
                      </td>
                      <td className={styles.nowrap}>
                        {receiptUrl ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm btn-outline"
                            onClick={() =>
                              setPreview({
                                src: receiptUrl,
                                title: req.uploadCode || "Receipt",
                              })
                            }
                          >
                            <i className="ri-image-2-line" aria-hidden />
                            View
                          </button>
                        ) : (
                          <span className={styles.muted}>No upload</span>
                        )}
                      </td>
                      <td>
                        <div
                          className={`${styles.pill} ${
                            styles[`pill-${tone.tone}`]
                          }`}
                        >
                          {tone.label}
                        </div>
                        {req.deal && (
                          <div className={`${styles.sub} ${styles.muted}`}>
                            Ticket #{req.deal}
                          </div>
                        )}
                        <div className={`${styles.sub} ${styles.muted}`}>
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
                            const intent =
                              target?.value === "reject" ? "reject" : "approve";
                            if (intent === "approve") {
                              void handleApprove(formData);
                            } else {
                              void handleReject(formData);
                            }
                          }}
                        >
                          <input
                            type="hidden"
                            name="receiptId"
                            value={req.id}
                          />
                          <input
                            type="text"
                            name="comment"
                            className={styles.commentInput}
                            defaultValue={
                              isRejected
                                ? req.comment || "Rejected"
                                : req.comment || "Deposit_BO"
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
                              {pendingId === req.id
                                ? "Processing..."
                                : "Reject"}
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

      {preview && (
        <div className={styles.receiptModal} role="dialog" aria-modal="true">
          <div className={styles.receiptCard}>
            <div className={styles.receiptHeader}>
              <div>
                <div className={styles.eyebrow}>Receipt</div>
                <div className={styles.main}>{preview.title}</div>
              </div>
              <button
                className="btn btn-xs btn-transparent"
                onClick={() => setPreview(null)}
                aria-label="Close receipt"
              >
                <i className="ri-close-line" aria-hidden />
              </button>
            </div>
            <div className={styles.receiptBody}>
              <img src={preview.src} alt={preview.title} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
