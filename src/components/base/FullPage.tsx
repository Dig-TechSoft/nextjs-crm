import React from "react";
import clsx from "clsx";

interface FullPageProps {
  children: React.ReactNode;
  nobranding?: boolean;
}

export default function FullPage({ children, nobranding = false }: FullPageProps) {
  return (
    <div className="full-page page-wrapper flex-content-center">
      <div className="wrapper wrapper-sm m-b-xl panel-wrapper">
        {!nobranding && (
          <>
            <div className="block txt-center m-b-lg">
              <figure className="logo">
              <img
                  src="/images/logo.svg"
                  alt="MT5 CRM logo"
                  width="40"
                  height="40"
                />
                <span className="txt">
                  MT5 <strong>CRM</strong>
                </span>
              </figure>
            </div>
            <div className="clearfix" />
          </>
        )}

        {children}
      </div>
    </div>
  );
}
