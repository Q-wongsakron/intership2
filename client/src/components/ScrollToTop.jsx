import React, { useState, useEffect } from "react";

import btn from "./btn.module.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons";

export default function ScrollToTop() {
	const [visible, setVisible] = useState(false);

	const toggleVisible = () => {
		const scrolled = document.documentElement.scrollTop;
		if (scrolled > 300) {
			setVisible(true);
		} else if (scrolled <= 300) {
			setVisible(false);
		}
	};

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	useEffect(() => {
		window.addEventListener("scroll", toggleVisible);

		return () => {
			window.removeEventListener("scroll", toggleVisible);
		};
	}, []);

	return (
		<button
			className={`scrollToTopBtn`}
			style={{ display: visible ? "inline-block" : "none" }}
			onClick={scrollToTop}
		>
			<FontAwesomeIcon icon={faChevronUp} />
		</button>
	);
}
