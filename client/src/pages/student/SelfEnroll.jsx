import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format, formatDistance, formatRelative, subDays } from "date-fns";
import { th } from "date-fns/locale";

import btn from "../../components/btn.module.css";
import Loading from "../../components/Loading";
import { Modal, Button } from "react-bootstrap";

import { useSelector } from "react-redux";

import { getStudentProfile } from "../../services/user.service";
import axios from "axios";

function SelfEnroll() {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowMoal] = useState(false);
	const [requireDocStates, setRequireDocStates] = useState({ require_doc: 0 });
	const [disabledFieldset, setDisabledFieldset] = useState(false);

	const [apiResponse, setApiResponse] = useState(null);
	const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);

	const navigate = useNavigate();

	const user = useSelector((state) => state.user);

	const [formData, setFormData] = useState({
		displayname_th: "",
		std_id: "",
		company_name: "",
		company_address: "",
		to_who: "",
		tel: "",
		email: "",
	});
	const [errors, setErrors] = useState({
		displayname_th: "",
		std_id: "",
		company_name: "",
		company_address: "",
		to_who: "",
		tel: "",
		email: "",
	});

	const handleInputChange = (e) => {
		e.preventDefault();

		const { name, value } = e.target;

		setFormData({
			...formData,
			[name]: value,
		});
		setErrors({
			...errors,
			[name]: "",
		});
	};

	const loadData = async (authtoken) => {
		try {
			const res = await getStudentProfile(authtoken);
			setData(res.data);

			setFormData({
				displayname_th: res.data.displayname_th || "",
				// tel: res.data.tel || "",
				// email: res.data.email || "",
			});

			setDisabledFieldset(res.data.status === "0" ? false : true); // if student has already self-enroll then disabled the form
		} catch (err) {
			console.log(
				"Load data failed: ",
				err.response ? err.response.data : err.message
			);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		setShowMoal(true);
	};

	const handleConfirmSubmit = async () => {
		setShowMoal(false);
		try {
			const newSelfEnroll = await axios.post(
				import.meta.env.VITE_APP_API + "/newSelfEnroll",
				{ formData, require_doc: requireDocStates },
				{
					headers: {
						authtoken: user.user.token,
					},
				}
			);

			setApiResponse(newSelfEnroll.data);
			setIsResponseModalOpen(true);
			// navigate("/student/internship");
		} catch (error) {
			setIsResponseModalOpen(true);
			setApiResponse(error.response.data);
			console.error(
				"Submit Failed: ",
				err.response ? err.response.data : err.message
			);
		} finally {
			setLoading(false);
		}
	};

	const ResponseModal = () => {
		return (
			<Modal
				show={isResponseModalOpen}
				onHide={() => setIsResponseModalOpen(false)}
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title className="fw-bold">ยื่นข้อมูลฝึกงาน</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{apiResponse ? <p>{apiResponse.message}</p> : <p>Loading...</p>}
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() => {
							setIsResponseModalOpen(false);
							navigate("/student/internship");
						}}
					>
						ปิด
					</Button>
				</Modal.Footer>
			</Modal>
		);
	};

	const ConfirmModal = () => {
		return (
			<Modal show={showModal} onHide={() => setShowMoal(false)} centered>
				<Modal.Header closeButton>
					<Modal.Title className="fw-bold">ยื่นที่ฝึกงานเอง</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p className="fw-bold">โปรดตรวจสอบความถูกต้องของข้อมูลก่อนกดยืนยัน</p>
					<br />

					<div>
						<p>
							ชื่อนักศึกษา :{" "}
							<span className="fw-bold">{formData.displayname_th}</span>
						</p>
						<p>
							เลขทะเบียน : <span className="fw-bold">{data.std_id}</span>
						</p>
					</div>
					<br />

					<div>
						<p>
							ชื่อบริษัท/หน่วยงาน :{" "}
							<span className="fw-bold">{formData.company_name}</span>
						</p>
						<p>
							ที่อยู่บริษัท/หน่วยงาน :{" "}
							{formData.company_address ? (
								<span className="fw-bold">{formData.company_address}</span>
							) : (
								<span>-</span>
							)}
						</p>
						<p>
							เรียน (ตำแหน่ง) :{" "}
							<span className="fw-bold">{formData.to_who}</span>
						</p>
					</div>
					<br />

					<div>
						<p>
							เบอร์โทรติดต่อบริษัท :{" "}
							<span className="fw-bold">{formData.tel}</span>
						</p>
						<p>
							อีเมลติดต่อบริษัท :{" "}
							<span className="fw-bold">{formData.email}</span>
						</p>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowMoal(false)}>
						ปิด
					</Button>
					<Button
						className={`${btn.btn_blue}`}
						onClick={() => {
							handleConfirmSubmit();
							// navigate("/student/internship");
						}}
					>
						ยืนยัน
					</Button>
				</Modal.Footer>
			</Modal>
		);
	};

	useEffect(() => {
		setLoading(true);
		loadData(user.user.token);
	}, [user.user.token]);

	if (loading) {
		return <Loading />;
	}
	// console.log(requireDocStates);

	return (
		<>
			<div className="container p-3 p-md-4 container-card">
				<div className="d-flex justify-content-between">
					<h3 className="stdProfileTitle mb-3 fw-bold">
						แบบฟอร์มขอหนังสือ ขอความอนุเคราะห์ฝึกงานภาคฤดูร้อน
					</h3>

					{disabledFieldset && (
						<Link to={"/student/edit-self-enroll"}>
							<button
								className={`${btn.btn_blue_outline}`}
								disabled={!disabledFieldset}
							>
								แก้ไขข้อมูล
							</button>
						</Link>
					)}
				</div>

				<form
					id="self-enroll-form"
					className="form-outline mb-4"
					onSubmit={handleSubmit}
				>
					<fieldset disabled={disabledFieldset}>
						<div className="px-2 pt-3">
							<p>
								<span className="fw-bold">วันที่ </span>
								<span className="text-decoration-underline">
									<Today />
								</span>
							</p>
							<br />

							<div className="row">
								<div className="col-sm-6">
									<label htmlFor="displayname_th" className="fw-bold">
										ชื่อนักศึกษา <span className="text-danger">*</span>
									</label>
									<input
										type="text"
										id="displayname_th"
										className="form-control mb-2"
										name="displayname_th"
										value={formData.displayname_th}
										placeholder="ชื่อ-นามสกุล"
										onChange={handleInputChange}
										maxLength={100}
										required
									/>
								</div>
								<div className="col-sm-6 mt-2 mt-sm-0">
									<p className="fw-bold">เลขทะเบียน</p>
									{data.std_id ? (
										<h6>{data.std_id}</h6>
									) : (
										<p className="text-muted">-</p>
									)}
								</div>
							</div>

							<div className="row mt-3">
								<div className="col-sm-12">
									{data.department ? (
										<div className="d-flex flex-column flex-md-row justify-content-start">
											<div className="me-2">
												เป็นนักศึกษา{" "}
												<span className="fw-bold">{data.department}</span>{" "}
												สาขาวิชาวิศวกรรมคอมพิวเตอร์
											</div>
											{/* <div>
											<select
												className="form-select form-select-sm"
												aria-label="Default select example"
											>
												<option defaultValue="computer" label="คอมพิวเตอร์">
													คอมพิวเตอร์
												</option>
											</select>
										</div> */}
										</div>
									) : (
										<p className="text-muted">-</p>
									)}
								</div>
							</div>

							<div className="row mt-3">
								<div className="col-sm-12">
									<label htmlFor="company_name" className="fw-bold">
										ชื่อบริษัท/หน่วยงาน (ที่จะไปฝึกงาน){" "}
										<span className="text-danger">*</span>
									</label>
									<input
										type="text"
										id="company_name"
										className="form-control mb-2"
										name="company_name"
										value={formData.company_name}
										placeholder="ชื่อบริษัท/หน่วยงาน"
										onChange={handleInputChange}
										maxLength={255}
										required
									/>
								</div>
								<div className="col-sm-12 mt-2 mt-sm-0">
									<label htmlFor="company_address" className="fw-bold">
										ที่อยู่บริษัท/หน่วยงาน (ถ้ามี)
									</label>
									<input
										type="text"
										id="company_address"
										className="form-control mb-2"
										name="company_address"
										value={formData.company_address}
										placeholder="ที่อยู่บริษัท/หน่วยงาน"
										onChange={handleInputChange}
										maxLength={255}
									/>
								</div>
							</div>

							<div className="row mt-3">
								<div className="col-sm-6">
									<label htmlFor="to_who" className="fw-bold">
										หนังสือขอความอนุเคราะห์การฝึกงาน เรียน (ตำแหน่ง){" "}
										<span className="text-danger">*</span>
									</label>
									<input
										type="text"
										id="to_who"
										className="form-control mb-2"
										name="to_who"
										value={formData.to_who}
										onChange={handleInputChange}
										maxLength={255}
										placeholder="เรียน (ตำแหน่ง)"
										required
									/>
								</div>
								<div className="col-sm-6 mt-2 mt-sm-0">
									<p className="fw-bold mb-0">ต้องการเอกสารฉบับจริงหรือไม่ ?</p>
									{/* <br />
								<p>ต้องการ</p>
								<input
									type="checkbox"
									checked={requireDocStates["require_doc"] === 1}
									onChange={(e) =>
										setRequireDocStates({
											...requireDocStates,
											require_doc: e.target.checked ? 1 : 0,
										})
									}
								/> */}

									<div className="form-check form-check-inline">
										<input
											className="form-check-input"
											type="radio"
											name="inlineRadioOptions"
											id="requireDoc1"
											checked={requireDocStates["require_doc"] === 1}
											onChange={(e) =>
												setRequireDocStates({
													...requireDocStates,
													require_doc: e.target.checked ? 1 : 0,
												})
											}
										/>
										<label className="form-check-label" htmlFor="requireDoc1">
											ต้องการ
										</label>
									</div>
									<div className="form-check form-check-inline">
										<input
											className="form-check-input"
											type="radio"
											name="inlineRadioOptions"
											id="requireDoc0"
											checked={requireDocStates["require_doc"] === 0}
											onChange={(e) =>
												setRequireDocStates({
													...requireDocStates,
													require_doc: e.target.checked ? 0 : 1,
												})
											}
										/>
										<label className="form-check-label" htmlFor="requireDoc0">
											ไม่ต้องการ
										</label>
									</div>
								</div>
							</div>

							<div className="row mt-3">
								<div className="col-sm-6">
									<label htmlFor="tel" className="fw-bold">
										เบอร์โทรติดต่อบริษัท{" "}
										<span className="text-danger">*</span>
									</label>
									<input
										type="tel"
										id="tel"
										className="form-control mb-2"
										name="tel"
										value={formData.tel}
										placeholder="เบอร์โทรติดต่อบริษัท"
										onChange={handleInputChange}
										maxLength={20}
										required
									/>
								</div>
								<div className="col-sm-6 mt-2 mt-sm-0">
									<label htmlFor="email" className="fw-bold">
										อีเมลติดต่อบริษัท <span className="text-danger">*</span>
									</label>
									<input
										type="email"
										id="email"
										className="form-control mb-2"
										name="email"
										value={formData.email}
										placeholder="อีเมลติดต่อบริษัท"
										onChange={handleInputChange}
										maxLength={255}
										required
									/>
								</div>
							</div>
						</div>
						<br />
						<div className="d-flex justify-content-center">
							<button
								type="submit"
								form="self-enroll-form"
								className={`${btn.btn_blue} w-100`}
							>
								ยืนยัน
							</button>
						</div>
						{disabledFieldset && (
							<p className="mt-2 mb-0 fw-bold">
								หมายเหตุ<span className="text-danger">*</span>{" "}
								นักศึกษาได้ทำการยื่นฝึกงานเอง หรือทำการสมัครฝึกงานในระบบไปแล้ว
								หากมีข้อสงสัยกรุณาติดต่อภาควิชาฯ
							</p>
						)}
					</fieldset>
				</form>

				<ConfirmModal />
				<ResponseModal />
			</div>
		</>
	);

	function Today() {
		const [today, setToday] = useState(null);

		useEffect(() => {
			const date = new Date();
			const year = date.getFullYear() + 543; // ได้ไหม
			const formattedDate = format(date, `dd MMMM ${year}`, {
				locale: th,
			});
			setToday(formattedDate);
		}, []);

		return `${today}`;
	}

	function SelfEnrolled() {
		return (
			<div className="d-flex flex-column justify-content-center align-items-center p-5 min-vh-100 text-muted bg-light container-card">
				<h4>รอการอนุมัติหนังสือขอความอนุเคราะห์จากทางภาควิชา</h4>
				<small>
					- นักศึกษาดูสถานะการฝึกงานได้ที่ :{" "}
					<span className="text-light-blue">
						{/* <Link to={"/student/internship"}>การฝึกงานของฉัน</Link> */}
					</span>
				</small>
			</div>
		);
	}
}

export default SelfEnroll;
