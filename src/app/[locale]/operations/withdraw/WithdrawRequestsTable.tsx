"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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

const statusTone = (t: (key: string, vars?: Record<string, any>) => string) => ({
  transferred: { label: t("status.approved"), tone: "success" },
  approved: { label: t("status.approved"), tone: "success" },
  pending: { label: t("status.pending"), tone: "warning" },
  rejected: { label: t("status.rejected"), tone: "danger" },
  cancelled: { label: t("status.cancelled"), tone: "muted" },
});

export default function WithdrawRequestsTable({ requests }: WithdrawalTableProps) {
  const router = useRouter();
  const t = useTranslations("WithdrawTable");
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
            error instanceof Error ? error.message : t("errors.unexpectedApproval"),
        },
      }));
      setPendingId(null);
      return;
    }

    if (result?.success) {
      setFeedback((prev) => ({
        ...prev,
        [id]: { type: "success", message: t("approved") },
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
            error instanceof Error ? error.message : t("errors.unexpectedRejection"),
        },
      }));
      setPendingId(null);
      return;
    }

    if (result?.success) {
      setFeedback((prev) => ({
        ...prev,
        [id]: { type: "success", message: t("rejected") },
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
                <th className={styles.tight}>{t("columns.balances")}</th>
                <th className={styles.tight}>{t("columns.payment")}</th>
                <th className={styles.min}>{t("columns.status")}</th>
                <th className={styles.min}>{t("columns.action")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const statusKey = (req.status || "").toLowerCase();
                const toneMap = statusTone(t);
                const tone =
                  toneMap[statusKey as keyof ReturnType<typeof statusTone>] ||
                  toneMap.pending;
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
                          {req.login || t("unknown")}
                          {req.amount !== null && (
                            <span className={styles.amount}>
                              {formatAmount(req.amount)} {req.currency || "USD"}
                            </span>
                          )}
                        </div>
                        <div className={styles.sub}>
                          {req.clientName || <span className={styles.muted}>{t("client")}</span>}
                        </div>
                        <div className={styles.sub}>
                          {req.comment ? (
                            <span title={req.comment}>{req.comment}</span>
                          ) : (
                            <span className={styles.muted}>{t("noComment")}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={styles.balancesCell}>
                      <div className={styles.stack}>
                        <div className={styles.main}>
                          {t("balanceLine", {
                            bal: formatAmount(req.balance),
                            eq: formatAmount(req.equity),
                          })}
                        </div>
                        <div className={styles.sub}>
                          {t("marginLine", {
                            margin: formatAmount(req.margin),
                            free: formatAmount(req.marginFree),
                          })}
                        </div>
                        <div className={styles.sub}>
                          {t("levelLine", {
                            level: formatAmount(req.marginLevel),
                            credit: formatAmount(req.credit),
                          })}
                        </div>
                      </div>
                    </td>
                    <td className={styles.paymentCell}>
                      <div className={`${styles.stack} ${styles.paymentStack}`}>
                        <div className={styles.main}>
                          {req.paymentMethod || req.bankName || t("unknown")}
                        </div>
                        <div className={styles.sub}>
                          {req.bankNumber ||
                            req.walletAddress ||
                            req.usdtType ||
                            t("unknown")}
                        </div>
                      </div>
                    </td>
                    <td className={styles.statusCell}>
                      <div className={`${styles.pill} ${styles[`pill-${tone.tone}`]}`}>
                        {tone.label}
                      </div>
                      {req.deal && (
                        <div className={`${styles.sub} ${styles.muted} ${styles.nowrap}`}>
                          {t("deal", { id: req.deal })}
                        </div>
                      )}
                      {req.cancelWithdrawDeal && (
                        <div className={`${styles.sub} ${styles.muted} ${styles.nowrap}`}>
                          {t("refund", { id: req.cancelWithdrawDeal })}
                        </div>
                      )}
                      <div className={`${styles.sub} ${styles.muted} ${styles.nowrap}`}>
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
                            {pendingId === req.id ? t("processing") : t("reject")}
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
