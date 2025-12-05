"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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
  if (value === null || Number.isNaN(value)) return "--";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: Date | string | null) {
  if (!value) return "--";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
}

function getReceiptUrl(uploadCode: string | null) {
  if (!uploadCode) return null;
  const trimmed = uploadCode.trim();
  if (!trimmed) return null;
  const filename = trimmed.includes(".") ? trimmed : `${trimmed}.png`;
  return `/deposit_receipt/${encodeURIComponent(filename)}`;
}

const statusTone = (t: (key: string, vars?: Record<string, any>) => string) => ({
  approved: { label: t("status.approved"), tone: "success" },
  pending: { label: t("status.pending"), tone: "warning" },
  rejected: { label: t("status.rejected"), tone: "danger" },
});

export default function DepositRequestsTable({
  requests,
}: DepositRequestsTableProps) {
  const router = useRouter();
  const t = useTranslations("DepositTable");
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
            error instanceof Error ? error.message : t("errors.unexpectedApproval"),
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
          message: t("ticketSaved", { id: result.ticket ?? "" }),
        },
      }));
      startTransition(() => router.refresh());
    } else {
      setFeedback((prev) => ({
        ...prev,
        [id]: {
          type: "error",
          message: result?.error || t("errors.approval"),
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
            error instanceof Error ? error.message : t("errors.unexpectedRejection"),
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
          message: t("rejected"),
        },
      }));
      startTransition(() => router.refresh());
    } else {
      setFeedback((prev) => ({
        ...prev,
        [id]: {
          type: "error",
          message: result?.error || t("errors.rejection"),
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
              <strong>{t("emptyTitle")}</strong>
              <p>{t("emptySubtitle")}</p>
            </div>
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.requestsTable}>
              <thead>
                <tr>
                  <th className={styles.min}>{t("columns.request")}</th>
                  <th>{t("columns.account")}</th>
                  <th className={styles.tight}>{t("columns.payment")}</th>
                  <th className={styles.min}>{t("columns.receipt")}</th>
                  <th>{t("columns.status")}</th>
                  <th className={styles.min}>{t("columns.action")}</th>
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
                  const toneMap = statusTone(t);
                  const tone =
                    toneMap[toneKey as keyof ReturnType<typeof statusTone>] ||
                    toneMap.pending;
                  const feedbackMsg = feedback[req.id];

                  return (
                    <tr key={req.id}>
                      <td>
                        <span className={styles.main}>#{req.id}</span>
                      </td>
                      <td>
                        <div className={styles.stack}>
                          <div className={styles.main}>
                            {req.login || t("unknown")}
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
                                {t("noComment")}
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
                            {req.paymentMethod || t("unknown")}
                          </div>
                          <div className={`${styles.sub} ${styles.truncate}`}>
                            {req.usdtType ? `${req.usdtType} ` : ""}
                            {req.walletAddress || t("unknown")}
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
                                title: req.uploadCode || t("columns.receipt"),
                              })
                            }
                          >
                            <i className="ri-image-2-line" aria-hidden />
                            {t("view")}
                          </button>
                        ) : (
                          <span className={styles.muted}>{t("noUpload")}</span>
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
                            {t("ticket", { id: req.deal })}
                          </div>
                        )}
                        <div className={`${styles.sub} ${styles.muted}`}>
                          {t("updated", { date: formatDate(req.updateTime) })}
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
                            placeholder={t("commentPlaceholder")}
                            aria-label={t("commentPlaceholder")}
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
                                ? t("processing")
                                : isApproved
                                ? t("approved")
                                : t("approve")}
                            </button>
                            <button
                              type="submit"
                              value="reject"
                              className="btn btn-danger btn-sm btn-outline"
                              disabled={pendingId === req.id || isResolved}
                            >
                              {pendingId === req.id
                                ? t("processing")
                                : t("reject")}
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
                <div className={styles.eyebrow}>{t("columns.receipt")}</div>
                <div className={styles.main}>{preview.title}</div>
              </div>
              <button
                className="btn btn-xs btn-transparent"
                onClick={() => setPreview(null)}
                aria-label={t("close")}
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
