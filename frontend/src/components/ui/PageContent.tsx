import { type FC, type ReactNode } from "react";
import classes from "./PageContent.module.css";

type PageContentProps = {
  title: string;
  children: ReactNode;
};

const PageContent: FC<PageContentProps> = ({ title, children }) => {
	return (
		<div className={classes.content}>
			<h1>{title}</h1>
			{children}
		</div>
	);
};

export default PageContent;
