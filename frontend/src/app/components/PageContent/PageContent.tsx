"use client";

import { FC } from "react";
import { PageContentProps } from "../../../shared/types";
import classes from "./PageContent.module.css";

const PageContent: FC<PageContentProps> = ({ title, children }) => {
	return (
		<div className={classes.content}>
			<h1>{title}</h1>
			{children}
		</div>
	);
};

export default PageContent;
