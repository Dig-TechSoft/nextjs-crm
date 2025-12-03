import React from "react";
import clsx from "clsx";
import Image from "next/image";

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
                <Image
                  src="/images/flamycom.png"
                  alt="Flamycom CRM logo"
                  width={320}
                  height={96}
                  priority
                />
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
