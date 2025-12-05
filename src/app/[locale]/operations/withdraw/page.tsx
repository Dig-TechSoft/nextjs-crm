import React from "react";
import { Link } from "@/i18n/navigation";
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

function buildPageHref(page: number) {
  const safePage = page < 1 ? 1 : page;
  const params = new URLSearchParams();
  params.set("page", safePage.toString());
  return `/operations/withdraw?${params.toString()}`;
}

export default async function WithdrawPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<SearchParams>).then === "function"
      ? await (searchParams as Promise<SearchParams>)
      : (searchParams as SearchParams | undefined);

  const currentPage = getPage(resolvedSearchParams);
  const { requests: initialRequests, total } =
    await fetchWithdrawalRequestsPaginated(currentPage, PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const clampedPage = Math.min(Math.max(currentPage, 1), totalPages);
  const isAdjusted = clampedPage !== currentPage;
  const { requests } = isAdjusted
    ? await fetchWithdrawalRequestsPaginated(clampedPage, PAGE_SIZE)
    : { requests: initialRequests };

  const hasPrev = clampedPage > 1;
  const hasNext = clampedPage < totalPages;

  return (
    <div className={`panel ${styles.withdrawPage}`}>
      <div className={`panel-header ${styles.withdrawHeader}`}>
        <div className={styles.titles}>
          <p className={styles.eyebrow}>Balance Operations</p>
          <h1>Withdraw Requests</h1>
          <p className={styles.muted}>
            Review withdrawal submissions, approve transfers, or refund rejected ones.
          </p>
        </div>
        <div className={styles.summary}>
          <div className={styles.headerPill}>
            <i className="ri-stack-line" aria-hidden />
            {total} requests
          </div>
          <RefreshButton />
        </div>
      </div>

      <WithdrawRequestsTable requests={requests as WithdrawalRequest[]} />

      <div className={styles.pagination}>
        <span className={styles.pageInfo}>
          Page {clampedPage} of {totalPages}
        </span>
        <div className={styles.pageControls}>
          <Link
            href={buildPageHref(clampedPage - 1)}
            aria-disabled={!hasPrev}
            className={`btn btn-secondary btn-sm btn-outline ${
              !hasPrev ? styles.disabled : ""
            }`}
          >
            <i className="ri-arrow-left-line" aria-hidden />
          </Link>
          <Link
            href={buildPageHref(clampedPage + 1)}
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
