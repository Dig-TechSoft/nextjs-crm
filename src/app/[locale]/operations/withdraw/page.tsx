import React from "react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import WithdrawRequestsTable from "./WithdrawRequestsTable";
import {
  fetchWithdrawalRequestsPaginated,
  type WithdrawalRequest,
} from "./actions";
import RefreshButton from "./RefreshButton";
import styles from "./withdraw.module.scss";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 6;

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

function getPage(searchParams?: SearchParams) {
  if (!searchParams) return 1;

  const rawValue = Array.isArray(searchParams.page)
    ? searchParams.page[0]
    : searchParams.page;

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function buildPageHref(
  page: number,
  filters: { status?: string; from?: string; to?: string }
) {
  const safePage = page < 1 ? 1 : page;
  const params = new URLSearchParams();
  params.set("page", safePage.toString());
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();
  return query ? `/operations/withdraw?${query}` : `/operations/withdraw`;
}

export default async function WithdrawPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const t = await getTranslations("WithdrawPage");
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<SearchParams>).then === "function"
      ? await (searchParams as Promise<SearchParams>)
      : (searchParams as SearchParams | undefined);

  const filters = {
    status: Array.isArray(resolvedSearchParams?.status)
      ? resolvedSearchParams?.status[0]
      : resolvedSearchParams?.status || "pending",
    from: Array.isArray(resolvedSearchParams?.from)
      ? resolvedSearchParams?.from[0]
      : resolvedSearchParams?.from,
    to: Array.isArray(resolvedSearchParams?.to)
      ? resolvedSearchParams?.to[0]
      : resolvedSearchParams?.to,
  };

  const currentPage = getPage(resolvedSearchParams);
  const { requests: initialRequests, total } =
    await fetchWithdrawalRequestsPaginated(currentPage, PAGE_SIZE, filters);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const clampedPage = Math.min(Math.max(currentPage, 1), totalPages);
  const isAdjusted = clampedPage !== currentPage;
  const { requests } = isAdjusted
    ? await fetchWithdrawalRequestsPaginated(clampedPage, PAGE_SIZE, filters)
    : { requests: initialRequests };

  const hasPrev = clampedPage > 1;
  const hasNext = clampedPage < totalPages;

  return (
    <div className={`panel ${styles.withdrawPage}`}>
      <div className={`panel-header ${styles.withdrawHeader}`}>
        <div className={styles.titles}>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p className={styles.muted}>{t("description")}</p>
        </div>
        <div className={styles.summary}>
          <div className={styles.headerPill}>
            <i className="ri-stack-line" aria-hidden />
            {t("requestsLabel", { count: total })}
          </div>
          <RefreshButton />
        </div>
      </div>

      <form className={styles.filterBar} method="get">
        <div className={styles.filterGroup}>
          <label htmlFor="from">{t("filters.from")}</label>
          <input id="from" type="date" name="from" defaultValue={filters.from} />
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="to">{t("filters.to")}</label>
          <input id="to" type="date" name="to" defaultValue={filters.to} />
        </div>
        <div className={`${styles.filterGroup} ${styles.statusGroup}`}>
          <label htmlFor="status">{t("filters.status")}</label>
          <select id="status" name="status" defaultValue={filters.status || "pending"}>
            <option value="pending">{t("filters.statusOptions.pending")}</option>
            <option value="approved">{t("filters.statusOptions.approved")}</option>
            <option value="rejected">{t("filters.statusOptions.rejected")}</option>
            <option value="cancelled">{t("filters.statusOptions.cancelled")}</option>
            <option value="all">{t("filters.statusOptions.all")}</option>
          </select>
        </div>
        <div className={styles.filterActions}>
          <button type="submit" className="btn btn-primary btn-sm">
            {t("filters.apply")}
          </button>
          <Link href="/operations/withdraw" className="btn btn-secondary btn-sm btn-outline">
            {t("filters.clear")}
          </Link>
        </div>
      </form>

      <WithdrawRequestsTable requests={requests as WithdrawalRequest[]} />

      <div className={styles.pagination}>
        <span className={styles.pageInfo}>
          {t("pageInfo", { current: clampedPage, total: totalPages })}
        </span>
        <div className={styles.pageControls}>
          <Link
            href={buildPageHref(clampedPage - 1, filters)}
            aria-disabled={!hasPrev}
            className={`btn btn-secondary btn-sm btn-outline ${
              !hasPrev ? styles.disabled : ""
            }`}
          >
            <i className="ri-arrow-left-line" aria-hidden />
          </Link>
          <Link
            href={buildPageHref(clampedPage + 1, filters)}
            aria-disabled={!hasNext}
            className={`btn btn-secondary btn-sm btn-outline ${
              !hasNext ? styles.disabled : ""
            }`}
          >
            <i className="ri-arrow-right-line" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
