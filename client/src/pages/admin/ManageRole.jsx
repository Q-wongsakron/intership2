import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";

import { listAllUser, chaneRole } from "../../services/user.service";

const ManageUser = () => {
	const [data, setData] = useState([]);
	const { user } = useSelector((state) => ({ ...state }));
	useEffect(() => {
		loadData(user.user.token);
	}, []);

	const loadData = async (authtoken) => {
		//ดึง data user ใน model
		await listAllUser(authtoken)
			.then((res) => {
				console.log(res.data);
				setData(res.data);
			})
			.catch((err) => {
				console.log(err);
			});
	};

	const role = ["student", "employer"];
	const handleChangeRole = async (std_id, e) => {
		console.log(std_id, e.target.value);
		const value = {
			std_id: std_id,
			role: e.target.value,
		};
		await chaneRole(user.user.token, value)
			.then((res) => {
				loadData(user.user.token);
			})
			.catch((err) => {
				console.log(err);
			});
	};

	useEffect(() => {
		loadData(user.user.token);
	}, []);

	return (
		<>
			<div className="container p-3 p-sm-4 container-card">
				<div className="d-flex justify-content-between mb-4">
					<h3 className="fw-bold">AllUserList Page</h3>
				</div>

				<div className="table-responsive text-nowrap">
					<table className="table table-striped">
						<thead>
							<tr className="table-dark">
								<th scope="col">#</th>
								<th scope="col">ชื่อผู้ใช้</th>
								<th scope="col">ROLE</th>
								<th scope="col">ACTION</th>
							</tr>
						</thead>
						<tbody>
							{data
								? data.map((item, index) => (
										<tr key={index}>
											<th scope="row">{index + 1}</th>
											<td>{item.std_id}</td>
											<td>{item.role}</td>
											<td>
												<select
													onChange={(e) => handleChangeRole(item.std_id, e)}
													value={item.role}
													className="form-select"
													style={{ width: "100px" }}
												>
													{role.map((roleItem) => (
														<option key={roleItem} value={roleItem}>
															{roleItem}
														</option>
													))}
												</select>
											</td>
										</tr>
								  ))
								: null}
						</tbody>
					</table>
					<Link to={"/admin"}>Back</Link>
				</div>
			</div>
		</>
	);
};

export default ManageUser;
