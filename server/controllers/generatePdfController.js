const db = require("../db/index");
const { student, employer, confirm, setup_courtesy, gen_document, edit_courtesy, self_enroll,gen_document_self} = db;
db.sequelize.sync();
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require('path');

let currentDate = Date.now();
let date_ob = new Date(currentDate);
let currentMonth = date_ob.getMonth() + 1;
let semesterYear = date_ob.getFullYear() + 543

if(currentMonth >= 7 && currentMonth <= 12){
    semesterYear = date_ob.getFullYear() + 543
}else if(currentMonth >= 1 && currentMonth <= 6)
    semesterYear = date_ob.getFullYear() + 542
semesterYear = semesterYear.toString();
// use to convert to thai number
function convertToThaiNumber(arabicNumber) {
    const thaiNumbers = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];

    if (typeof arabicNumber !== 'number' || arabicNumber < 0 || arabicNumber > 9) {
        return 'Invalid input. Please provide a number between 0 and 9.';
    }

    return thaiNumbers[arabicNumber];
}

// call convert to thai number
function convertStringToThaiNumber(inputString) {
    if (typeof inputString !== 'string') {
        return 'Invalid input. Please provide a string.';
    }

    let thaiString = '';

    for (let i = 0; i < inputString.length; i++) {
        const digit = parseInt(inputString[i], 10);
        const thaiDigit = convertToThaiNumber(digit);
        thaiString += thaiDigit;
    }

    return thaiString;
}
//create DOC setup (long time to use)
exports.setup_courtesy = async (req, res) => {
    try {
        console.log("Received setup request:", req.body);
        const { start_date_convert, end_date_convert, head_name,end_date_year } = req.body.formData;
        console.log("Extracted form data:", { start_date_convert, end_date_convert, head_name, end_date_year });
        
        const setup = await setup_courtesy.create({
            
            start_date:start_date_convert,
            end_date:end_date_convert,
            end_date_year:end_date_year,
            head_name
            
        });

        console.log("Setup document created:", setup);

        res.status(200).json({
            message: "Success",
        
        });
    } catch (err) {
        console.error("Error during setup:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// data each courtasy that created ?
exports.showEditCourtasy = async (req, res) => {
    try{
        const { id } = req.params;
   
        const showEditCourtasy = await edit_courtesy.findOne({where: {std_id: id}})
    
        res.status(200).send(showEditCourtasy)
    }catch(err){
        console.error(err)
        res.status(500).send("Internal Server Error");
    }
}

// All data in edit courtesy
exports.showAllEditCourtasy = async (req, res) => {
    try{
    
        const showAllEditCourtasy = await edit_courtesy.findAll()
    
        res.status(200).send(showAllEditCourtasy)
    }catch(err){
        console.error(err)
        res.status(500).send("Internal Server Error");
    }
}

// cover year to พ.ศ.
function getdate(){
    const thaiNumerals = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
    const currentDate = new Date();
    // Convert the current year to Thai numerals and add 543
    const thaiYear = (currentDate.getFullYear() + 543).toString().replace(/\d/g, digit => thaiNumerals[digit]);
    return thaiYear.slice(-2);
}

// default data for gen DOC
function instantDataDoc() {
    const fontsize = 15
    const thisdate = getdate();
    const font = "./asset/THSarabunNew.ttf"
    const img_cover = "./asset/ตราครุฑ.png"
    

    const payload = {fontsize, thisdate,font,img_cover}
    return payload;
}

// create create new pre DOC
exports.preCreateCourtesy = async (req, res) => {
    
    try{
        // load data from client
        const {std_id, number_courtesy,number_letter, date, name_to } = req.body;
        // create new edit data 
        const saveEditGenDoc = await edit_courtesy.create({
                std_id: std_id,
                number_courtesy: number_courtesy,
                number_letter:number_letter,
                date: date,
                name_to: name_to
        })
        
        
        res.status(200).json({message: "Created Pre Pdf Successfully"})
   
    }catch(err){
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
}




// edit pre DOC
exports.editPreCreateCourtesy = async (req, res) => {
    
    try{
        // load data from client
        const {std_id, number_courtesy, number_letter, date, name_to } = req.body;
        // update edit data 
        const saveEditGenDoc = await edit_courtesy.update({
                std_id: std_id,
                number_courtesy: number_courtesy,
                number_letter: number_letter,
                date: date,
                name_to: name_to
        }, {where: {std_id : std_id}})
        
        
        res.status(200).json({message: "Update Pdf Successfully"})
   
    }catch(err){
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
}



// create new DOC
exports.createCourtesy = async (req, res) => {
    
    try{
        // modify loop create many document in one time

        // load default data
        const setupD = instantDataDoc();;
        const thisdate = setupD.thisdate;
        const fontsize = setupD.fontsize;
        const thaiFontPath = setupD.font
        const imagePath = setupD.img_cover;
        const currentDate = new Date();
        const utcOffset = 7 * 60; // UTC+7 in minutes
        currentDate.setMinutes(currentDate.getMinutes() + utcOffset);
        // Create a new PDF document with the Thai font
        const doc = new PDFDocument({ font: thaiFontPath });
        const doc2 = new PDFDocument({ font: thaiFontPath });
        const doc3 = new PDFDocument({ font: thaiFontPath });
        // const { id } = req.params;
        const {std_id,employer_id, number_courtesy, number_letter, date, name_to } = req.body;
        const data = await confirm.findOne({
            where: {std_id: std_id },   
            include: {model : student}
        })
        const setup = await setup_courtesy.findAll()
        const lastSetup = setup[setup.length - 1]
        
        const thaiString = convertStringToThaiNumber(data.student.std_id);

        // check if used to create
        const findUser = await gen_document.findOne({
            where: {std_id: std_id },   
        })

        // create a gen DOC
        if (!findUser){
            const saveGenDoc = await gen_document.create({
                std_id: std_id,
                employer_id: employer_id,
                doc_nonlicense: `${semesterYear}/${std_id}/doc_nonlicense_${std_id}.pdf`,
                courtesy_license: `${semesterYear}/${std_id}/courtesy_license_${std_id}.pdf`,
                intern_letter: `${semesterYear}/${std_id}/letter_license_${std_id}.pdf`
            })
            // udate status in confirm database
            const updateStatus = await confirm.update(
                {
                    status: "ดำเนินเอกสารเสร็จสิ้น",
                    date_gen_doc: currentDate
                  },
                  {
                    where: { std_id: std_id },
                  }
            )
            const updateStatusStd = await student.update(
                {
                    status: "3",
                  },
                  {
                    where: { std_id: std_id },
                  }
            )

            // create new edit data 
            // const saveEditGenDoc = await edit_courtesy.create({
            //     std_id: std_id,
            //     number: number,
            //     date: date,
            //     name_to: name_to
            // })
        }
        

        // Create DOC
        docCreateWithLic(doc,std_id,fontsize,thisdate,number_courtesy,imagePath,date,name_to,data,thaiString,lastSetup,setupD)
        docCreateWithNonLic(doc2,std_id,fontsize,thisdate,number_courtesy,number_letter,imagePath,date,name_to,data,thaiString,lastSetup)
        docLetterCreateWithLic(doc3,std_id,fontsize,thisdate,number_letter,imagePath,date,name_to,data,thaiString,lastSetup,setupD)
        res.status(200).json({message: "Created Pdf Successfully"})
   
    }catch(err){
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
}

// create new DOC Multiple
exports.createMultiCourtesy = async (req, res) => {
    try {
        
        // Load default data
        const setupD = instantDataDoc();
        const thisdate = setupD.thisdate;
        const fontsize = setupD.fontsize;
        const thaiFontPath = setupD.font;
        const imagePath = setupD.img_cover;
        const currentDate = new Date();
        const utcOffset = 7 * 60; // UTC+7 in minutes
        currentDate.setMinutes(currentDate.getMinutes() + utcOffset);
        const Data = req.body.selectedItems;
        console.log("hello normal",Data)
        if (Data.length > 0) {
            await Promise.all(Data.map(async (item, index) => {
                console.log(item.std_id);

                // Create a new PDF document with the Thai font
                const doc = new PDFDocument({ font: thaiFontPath });
                const doc2 = new PDFDocument({ font: thaiFontPath });
                const doc3 = new PDFDocument({ font: thaiFontPath });

                const data = await confirm.findOne({
                    where: { std_id: item.std_id },
                    include: { model: student }
                });
                const setup = await setup_courtesy.findAll();
                const lastSetup = setup[setup.length - 1];

                const thaiString = convertStringToThaiNumber(data.student.std_id);

                const findUser = await gen_document.findOne({
                    where: { std_id: item.std_id },
                });

                if (!findUser) {
                    const saveGenDoc = await gen_document.create({
                        std_id: item.std_id,
                        employer_id: item.employer_id,
                        doc_nonlicense: `${semesterYear}/${item.std_id}/doc_nonlicense_${item.std_id}.pdf`,
                        courtesy_license: `${semesterYear}/${item.std_id}/courtesy_license_${item.std_id}.pdf`,
                        intern_letter: `${semesterYear}/${item.std_id}/letter_license_${item.std_id}.pdf`
                    });

                    const updateStatus = await confirm.update(
                        {
                            status: "ดำเนินเอกสารเสร็จสิ้น",
                            date_gen_doc: currentDate
                        },
                        {
                            where: { std_id: item.std_id },
                        }
                    );
                    const updateStatusStd = await student.update(
                        {
                            status: "3",
                          },
                          {
                            where: { std_id: item.std_id },
                          }
                    )
                    // const saveEditGenDoc = await edit_courtesy.create({
                    //     std_id: item.std_id,
                    //     number: item.number,
                    //     date: item.date,
                    //     name_to: item.name_to
                    // });
                }

                docCreateWithLic(doc, item.std_id, fontsize, thisdate, item.number_courtesy, imagePath, item.date, item.name_to, data, thaiString, lastSetup, setupD);
                docCreateWithNonLic(doc2, item.std_id, fontsize, thisdate, item.number_courtesy,item.number_letter, imagePath, item.date, item.name_to, data, thaiString, lastSetup);
                docLetterCreateWithLic(doc3,item.std_id,fontsize,thisdate,item.number_letter,imagePath,item.date,item.name_to,data,thaiString,lastSetup,setupD)
            }));
        } else {
            return res.status(400).json({ message: "Please Enter Data" });
        }

        return res.status(200).json({ message: "Created Pdf Successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
};
// create new DOC Multiple Self
exports.createMultiCourtesySelf = async (req, res) => {
    try {
        
        // Load default data
        const setupD = instantDataDoc();
        const thisdate = setupD.thisdate;
        const fontsize = setupD.fontsize;
        const thaiFontPath = setupD.font;
        const imagePath = setupD.img_cover;
        
        const currentDate = new Date();
        const utcOffset = 7 * 60; // UTC+7 in minutes
        currentDate.setMinutes(currentDate.getMinutes() + utcOffset);
        const Data = req.body.selectedItemsSelf;
        console.log("hello",Data)
        if (Data.length > 0) {
            await Promise.all(Data.map(async (item, index) => {
                console.log(item.std_id);

                // Create a new PDF document with the Thai font
                const doc = new PDFDocument({ font: thaiFontPath });
                const doc2 = new PDFDocument({ font: thaiFontPath });
                const doc3 = new PDFDocument({ font: thaiFontPath });

                const data = await edit_courtesy.findOne({
                    where: { std_id: item.std_id },
                    include: { model: student }
                });
                const setup = await setup_courtesy.findAll();
                const lastSetup = setup[setup.length - 1];

                const thaiString = convertStringToThaiNumber(data.student.std_id);

                const findUser = await gen_document_self.findOne({
                    where: { std_id: item.std_id },
                });

                if (!findUser) {
                    const saveGenDoc = await gen_document_self.create({
                        std_id: item.std_id,
                        self_enroll_id: item.self_enroll_id,
                        doc_nonlicense: `${semesterYear}/${item.std_id}/doc_nonlicense_${item.std_id}.pdf`,
                        courtesy_license: `${semesterYear}/${item.std_id}/courtesy_license_${item.std_id}.pdf`,
                        intern_letter: `${semesterYear}/${item.std_id}/letter_license_${item.std_id}.pdf`
                    });

                    const updateStatus = await self_enroll.update(
                        {
                            status: "ดำเนินเอกสารเสร็จสิ้น",
                            date_gen_doc: currentDate
                        },
                        {
                            where: { std_id: item.std_id },
                        }
                    );
                    const updateStatusStd = await student.update(
                        {
                            status: "3",
                          },
                          {
                            where: { std_id: item.std_id },
                          }
                    )
                    // const saveEditGenDoc = await edit_courtesy.create({
                    //     std_id: item.std_id,
                    //     number: item.number,
                    //     date: item.date,
                    //     name_to: item.name_to
                    // });
                }

                docCreateWithLic(doc, item.std_id, fontsize, thisdate, item.number_courtesy, imagePath, item.date, item.name_to, data, thaiString, lastSetup, setupD);
                docCreateWithNonLic(doc2, item.std_id, fontsize, thisdate, item.number_courtesy,item.number_letter, imagePath, item.date, item.name_to, data, thaiString, lastSetup);
                docLetterCreateWithLic(doc3,item.std_id,fontsize,thisdate,item.number_letter,imagePath,item.date,item.name_to,data,thaiString,lastSetup,setupD)
            }));
        } else {
            return res.status(400).json({ message: "Please Enter Data" });
        }

        return res.status(200).json({ message: "Created Pdf Successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
};

// edit Courtesy after created
exports.editCourtesy = async (req, res) => {
    try{
        // load default data
        const setupD = instantDataDoc();;
        const thisdate = setupD.thisdate;
        const fontsize = setupD.fontsize;
        const thaiFontPath = setupD.font
        const imagePath = setupD.img_cover;

        // Create a new PDF document with the Thai font
        const doc = new PDFDocument({ font: thaiFontPath });
        const doc2 = new PDFDocument({ font: thaiFontPath });
        const doc3 = new PDFDocument({ font: thaiFontPath });
        const {std_id, number_courtesy, number_letter, date, name_to } = req.body;
        const data = await edit_courtesy.findOne({
            where: {std_id: std_id },   
            include: {model : student}
        })
        const setup = await setup_courtesy.findAll()
        const lastSetup = setup[setup.length - 1]
        
        const thaiString = convertStringToThaiNumber(data.student.std_id);

        // update data edit
        const saveEditGenDoc = await edit_courtesy.update({
            number_courtesy: number_courtesy,
            number_letter: number_letter,
            date: date,
            name_to: name_to
        },{where: {std_id: std_id }}
        )
        
        // Re create DOC
        docCreateWithLic(doc,std_id,fontsize,thisdate,number_courtesy,imagePath,date,name_to,data,thaiString,lastSetup,setupD)
        docCreateWithNonLic(doc2,std_id,fontsize,thisdate,number_courtesy,number_letter,imagePath,date,name_to,data,thaiString,lastSetup)
        docLetterCreateWithLic(doc3,std_id,fontsize,thisdate,number_letter,imagePath,date,name_to,data,thaiString,lastSetup,setupD)
        res.status(200).json({message: "Created Pdf Successfully"})

    }catch(err){
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
}


// create new DOC Self
exports.createCourtesySelf = async (req, res) => {
    
    try{
        // modify loop create many document in one time

        // load default data
        const setupD = instantDataDoc();;
        const thisdate = setupD.thisdate;
        const fontsize = setupD.fontsize;
        const thaiFontPath = setupD.font
        const imagePath = setupD.img_cover;
        const currentDate = new Date();
        const utcOffset = 7 * 60; // UTC+7 in minutes
        currentDate.setMinutes(currentDate.getMinutes() + utcOffset);
        // Create a new PDF document with the Thai font
        const doc = new PDFDocument({ font: thaiFontPath });
        const doc2 = new PDFDocument({ font: thaiFontPath });
        const doc3 = new PDFDocument({ font: thaiFontPath });
        // const { id } = req.params;
        const {std_id,self_enroll_id, number_courtesy,number_letter, date, name_to } = req.body;
        const data = await self_enroll.findOne({
            where: {std_id: std_id },   
            include: {model : student}
        })
        const setup = await setup_courtesy.findAll()
        const lastSetup = setup[setup.length - 1]
        
        const thaiString = convertStringToThaiNumber(data.std_id);

        // check if used to create
        const findUser = await gen_document_self.findOne({
            where: {std_id: std_id },   
        })

        // create a gen DOC
        if (!findUser){
            const saveGenDoc = await gen_document_self.create({
                std_id: std_id,
                self_enroll_id: self_enroll_id,
                doc_nonlicense: `${semesterYear}/${std_id}/doc_nonlicense_${std_id}.pdf`,
                courtesy_license: `${semesterYear}/${std_id}/courtesy_license_${std_id}.pdf`,
                intern_letter: `${semesterYear}/${std_id}/letter_license_${std_id}.pdf`
            })
            // udate status in confirm database
            const updateStatus = await self_enroll.update(
                {
                    status: "ดำเนินเอกสารเสร็จสิ้น",
                    date_gen_doc: currentDate
                  },
                  {
                    where: { std_id: std_id },
                  }
            )
            const updateStatusStd = await student.update(
                {
                    status: "3",
                  },
                  {
                    where: { std_id: std_id },
                  }
            )
            // create new edit data 
            // const saveEditGenDoc = await edit_courtesy.create({
            //     std_id: std_id,
            //     number: number,
            //     date: date,
            //     name_to: name_to
            // })
        }
        

        // Create DOC
        docCreateWithLic(doc,std_id,fontsize,thisdate,number_courtesy,imagePath,date,name_to,data,thaiString,lastSetup,setupD)
        docCreateWithNonLic(doc2,std_id,fontsize,thisdate,number_courtesy,number_letter,imagePath,date,name_to,data,thaiString,lastSetup)
        docLetterCreateWithLic(doc3,std_id,fontsize,thisdate,number_letter,imagePath,date,name_to,data,thaiString,lastSetup,setupD)
        res.status(200).json({message: "Created Pdf Successfully"})
   
    }catch(err){
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
}


// function create courtesy with license
function docCreateWithLic(doc,std_id,fontsize,thisdate,number_courtesy,imagePath,date,name_to,data,thaiString,lastSetup,setupD){
        console.log(lastSetup.signature_img)
        // Define the path where the PDF file will be saved
            // Define the directory path
        const directoryPath = `./uploads/${semesterYear}/${std_id}/`;

        // Create directory if it does not exist
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        // Define the file path where the PDF file will be saved
        const filePath = path.join(directoryPath, `courtesy_license_${std_id}.pdf`);

        doc.pipe(fs.createWriteStream(filePath));

        doc.fontSize(fontsize).text(`ที่ อว ๖๗.๓๐/(วฟ-${thisdate}-${number_courtesy}) `, 93.390861224, 104.77838878);

        // insert image below
        doc.image(imagePath, 259.2, 50.184, { width: 80 });

        doc.fontSize(fontsize).text("คณะวิศวกรรมศาสตร์", 367.34397222, 104.77838878);
        doc.fontSize(fontsize).text("มหาวิทยาลัยธรรมศาสตร์ศูนย์รังสิต", 367.34397222, 122.50194444);
        doc.fontSize(fontsize).text("อ. คลองหลวง จ. ปทุมธานี ๑๒๑๒๐", 367.34397222, 139.78099999);

        doc.fontSize(fontsize).text(`${date}`, 301.91427778, 168.13022222);
        doc
        .fontSize(fontsize)
        .text("เรื่อง ขอความอนุเคราะห์นักศึกษาฝึกงานภาคฤดูร้อน",  93.390861224, 197.058);
        doc.fontSize(fontsize).text(`เรียน ${name_to}`, 93.390861224, 219.96738889);
        doc
        .fontSize(fontsize)
        .text("สิ่งที่ส่งมาด้วย แบบตอบรับนักศึกษาฝึกงานภาคฤดูร้อน", 93.390861224, 242.78152778);
        doc
        .fontSize(fontsize)
        .text(
            "ด้วย ภาควิชาวิศวกรรมไฟฟ้าและคอมพิวเตอร์ คณะวิศวกรรมศาสตร์ มหาวิทยาลัยธรรมศาสตร์",
            144,
            273.92261111
        );
        doc
        .fontSize(fontsize)
        .text(
            "ได้กําหนดวิชาการฝึกงานทางวิศวกรรมไฟฟ้าไว้ในหลักสูตร โดยมีนโยบายที่จะส่งเสริมให้นักศึกษาชั้นปีที่  ๓",
            93.390861224,
            291.23694444
        );
        doc
        .fontSize(fontsize)
        .text(
            "ได้มีประสบการณ์และความรอบรู้จากการทํางานจริง  ตลอดจนรู้จักใช้ความรู้จากการศึกษามาประยุกต์เข้ากับ",
            93.390861224,
            308.55480556
        );
        doc.fontSize(fontsize).text("การทํางาน", 93.390861224, 325.86913889);

        doc
        .fontSize(fontsize)
        .text(
            "ในการนี้ ภาควิชาฯจึงขอความอนุเคราะห์ให้นักศึกษา ดังรายนามต่อไปนี้",
            146.16994444,
            356
        );
        doc
        .fontSize(fontsize)
        .text(
            `๑.${data.student.name_title_th}${data.student.displayname_th}  เลขทะเบียน ${thaiString}    ${data.student.department}`,
            146.16994444,
            377.6
        );
        // doc
        // .fontSize(fontsize)
        // .text(
        //     "๒.นายxxxxx   xxxxxx  เลขทะเบียน xxxxxxxxxx    สาขาวิชาวิศวกรรมไฟฟ้ากําลัง",
        //     144,
        //     392
        // );
        doc
        .fontSize(fontsize)
        .text(
            `ได้มีโอกาสเข้าฝึกงานในหน่วยงานของท่าน ช่วงปิดภาคฤดูร้อน ระหว่างวันที่ ${lastSetup.start_date} ถึงวันที่ ${lastSetup.end_date}`,
            93.390861224,
            421.68
        );
        doc
        .fontSize(fontsize)
        .text(
            `${lastSetup.end_date_year}   (รวมเวลาฝึกงานไม่น้อยกว่า  ๒๔๐ ชั่วโมง) ภาควิชาฯ หวังเป็นอย่างยิ่งว่าจะได้รับความอนุเคราะห์`,
            93.390861224,
            437.96
        );
        doc.fontSize(fontsize).text("จากท่าน  ในครั้งนี้", 93.6, 456.896);
        doc
        .fontSize(fontsize)
        .text(
            "จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ด้วย จักขอบพระคุณยิ่ง",
            147.05894444,
            484.93072222
        );
        doc.fontSize(fontsize).text("ขอแสดงความนับถือ", 302.26705556, 513.19880556);
        doc.image(`./uploads/${lastSetup.signature_img}`, 276.984, 541.6, {scale: 0.05})
        doc.fontSize(fontsize).text(`(${lastSetup.head_name})`, 284.57172222, 592.64788889);
        doc.fontSize(fontsize).text("หัวหน้าภาควิชาวิศวกรรมไฟฟ้าและคอมพิวเตอร์", 259.23169444, 609.70822222);
        doc.fontSize(fontsize).text("ภาควิชาวิศวกรรมไฟฟ้าและคอมพิวเตอร์", 91.656, 644.605);
        doc.fontSize(fontsize).text("โทร. ๐ ๒๕๖๔ ๓๐๐๑-๙ ต่อ ๓๐๓๗", 91.656, 662.48730556);
        doc.fontSize(fontsize).text("โทรสาร ๐ ๒๕๖๔ ๓๐๒๑", 91.656, 680.83175);

        doc.end();
}
// function create lettern with license
function docLetterCreateWithLic(doc,std_id,fontsize,thisdate,number_letter,imagePath,date,name_to,data,thaiString,lastSetup,setupD){
    console.log(lastSetup.signature_img)
    // Define the path where the PDF file will be saved
        // Define the directory path
    const directoryPath = `./uploads/${semesterYear}/${std_id}/`;

    // Create directory if it does not exist
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Define the file path where the PDF file will be saved
    const filePath = path.join(directoryPath, `letter_license_${std_id}.pdf`);

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(fontsize).text(`ที่ อว ๖๗.๓๐/(วฟ-${thisdate}-${number_letter})`, 93.390861224, 91.77838878);

    // insert image below +10
    doc.image(imagePath, 259.2, 40.184, { width: 80 });
    //y = -13
    doc.fontSize(fontsize).text("คณะวิศวกรรมไฟฟ้าและคอมพิวเตอร์", 367.34397222, 91.77838878);
    doc.fontSize(fontsize).text("คณะวิศวกรรมศาสตร์", 367.34397222, 108.71172211);
    doc.fontSize(fontsize).text("มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต", 367.34397222, 125.64505544);
    doc.fontSize(fontsize).text("อ.คลองหลวง จ.ปทุมธานี ๑๒๑๒๐", 367.34397222, 142.57838877);
    //y = -10
    doc.fontSize(fontsize).text(`${date}`, 259.99722222, 166.38888889);
    // y = -12
    doc
      .fontSize(fontsize)
      .text("เรื่อง    ขอส่งตัวนักศึกษาฝึกงานภาคฤดูร้อน", 93.390861224, 203.37952778);
    doc.fontSize(fontsize).text(`เรียน    ${name_to}`, 93.390861224, 222.51608333);
    doc.fontSize(fontsize).text("อ้างถึง  แบบตอบรับนักศึกษาฝึกงานภาคฤดูร้อน", 93.390861224, 242.46566667);
    
    //y = -11
    doc
      .fontSize(fontsize)
      .text("สิ่งที่ส่งมาด้วย   ๑. ใบบันทึกเวลาการฝึกงานของนักศึกษา จํานวน ๒ ชุด", 93.390861224, 263.41172222);
    doc
      .fontSize(fontsize)
      .text("๒. แบบประเมินผลการฝึกงาน จํานวน ๒ ชุด", 158.99341667, 281.11763889);
    doc
      .fontSize(fontsize)
      .text("๓. แบบสอบถามผู้ประกอบการ จํานวน ๑ ชุด", 158.99341667, 297.99452778);
    //y = -7
    doc
      .fontSize(fontsize)
      .text("ตามที่อ้างถึง หน่วยงานของท่านได้ให้ความอนุเคราะห์ตอบรับนักศึกษา ภาควิชาวิศวกรรมไฟฟ้าและ", 149.29908333, 324.64286111);
    doc
      .fontSize(fontsize)
      .text("คอมพิวเตอร์  คณะวิศวกรรมศาสตร์  มหาวิทยาลัยธรรมศาสตร์  เข้ารับการฝึกงานภาคฤดูร้อน  ประจําปีการศึกษา", 93.390861224, 341.8055);
    doc
      .fontSize(fontsize)
      .text(`${convertStringToThaiNumber(semesterYear)} ระหว่างวันที่  ${lastSetup.start_date}  ถึงวันที่ ${lastSetup.end_date}  ${lastSetup.end_date_year}  (รวมเวลาไม่น้อยกว่า ๒๔๐ ชั่วโมง) แล้วนั้น`, 93.390861224, 359.20802778);
    // y = -7
    doc
      .fontSize(fontsize)
      .text("ภาควิชาฯ จึงขอส่งตัวนักศึกษา เข้าฝึกงานกับหน่วยงานของท่าน ดังรายชื่อต่อไปนี้", 149.29908333, 387.62075);
    
    doc
      .fontSize(fontsize)
      .text(`๑.${data.student.name_title_th}${data.student.displayname_th}  เลขทะเบียน ${thaiString}    ${data.student.department}`, 120.85108333, 407.55975);
    //y=-4
    doc
      .fontSize(fontsize)
      .text("อนึ่ง ภาควิชาฯ ได้จัดส่งเอกสารเพื่อประกอบการฝึกงานดังนี้", 149.29908333, 456.27622222);
    
    doc
      .fontSize(fontsize)
      .text("๑. ใบบันทึกการลงเวลาการฝึกงานของนักศึกษา สําหรับให้นักศึกษาลงเวลาการเข้าฝึกงาน", 120.85108333, 473.53763889);
    doc
      .fontSize(fontsize)
      .text("และขอความกรุณาผู้ควบคุมการฝึกงานลงนามท้ายใบบันทึกการลงเวลา", 132.52097222, 490.80258333);
    
    doc
      .fontSize(fontsize)
      .text("๒. แบบประเมินผลการฝึกงานให้ผู้ควบคุมการฝึกงานเป็นผู้ประเมิน", 120.85108333, 508.31094444);
    doc
      .fontSize(fontsize)
      .text("๓. แบบสอบถามผู้ประกอบการขอความกรุณาผู้ประกอบการให้ความเห็น", 120.85108333, 525.36775);
    doc
      .fontSize(fontsize)
      .text("จึงเรียนมาเพื่อโปรดทราบ และขอขอบพระคุณในความร่วมมือของท่านมา ณ โอกาสนี้", 149.29908333, 548.01608333);
      // y = -4
    doc.fontSize(fontsize).text("ขอแสดงความนับถือ", 303.55469444, 570.84433333);
    doc.image(`./uploads/${lastSetup.signature_img}`, 276.984, 590.6, {scale: 0.05})
    doc.fontSize(fontsize).text(`(${lastSetup.head_name})`, 274.94088889, 628.3965);
    doc.fontSize(fontsize).text("หัวหน้าภาควิชาวิศวกรรมไฟฟ้าและคอมพิวเตอร์", 255.86619444, 645.49916667);
     // y = -5
    doc.fontSize(12).text("สํานักงานภาควิชาฯ", 93.390861224, 674.085);
    doc.fontSize(12).text("โทร. ๐ ๒๕๖๔ ๓๐๐๑-๕ ต่อ ๓๐๓๗ (คุณบุญเรือน)", 93.390861224, 688.88402778);
    doc.fontSize(12).text("โทรสาร ๐๒๕๖๔ ๓๐๒๑", 93.390861224, 703.68305556);
    
    doc.end();
}
// function create courtesy with non lincense
function docCreateWithNonLic(doc,std_id,fontsize,thisdate,number_courtesy,number_letter,imagePath,date,name_to,data,thaiString,lastSetup){
    console.log(lastSetup.signature_img)
    // Define the path where the PDF file will be saved
        // Define the directory path
    const directoryPath = `./uploads/${semesterYear}/${std_id}/`;

    // Create directory if it does not exist
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Define the file path where the PDF file will be saved
    const filePath = path.join(directoryPath, `doc_nonlicense_${std_id}.pdf`);

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(fontsize).text(`ที่ อว ๖๗.๓๐/(วฟ-${thisdate}-${number_courtesy}) `, 93.390861224, 104.77838878);

    // insert image below
    doc.image(imagePath, 259.2, 50.184, { width: 80 });

    doc.fontSize(fontsize).text("คณะวิศวกรรมศาสตร์", 367.34397222, 104.77838878);
    doc.fontSize(fontsize).text("มหาวิทยาลัยธรรมศาสตร์ศูนย์รังสิต", 367.34397222, 122.50194444);
    doc.fontSize(fontsize).text("อ. คลองหลวง จ. ปทุมธานี ๑๒๑๒๐", 367.34397222, 139.78099999);

    doc.fontSize(fontsize).text(`${date}`, 301.91427778, 168.13022222);
    doc
    .fontSize(fontsize)
    .text("เรื่อง ขอความอนุเคราะห์นักศึกษาฝึกงานภาคฤดูร้อน",  93.390861224, 197.058);
    doc.fontSize(fontsize).text(`เรียน ${name_to}`, 93.390861224, 219.96738889);
    doc
    .fontSize(fontsize)
    .text("สิ่งที่ส่งมาด้วย แบบตอบรับนักศึกษาฝึกงานภาคฤดูร้อน", 93.390861224, 242.78152778);
    doc
    .fontSize(fontsize)
    .text(
        "ด้วย ภาควิชาวิศวกรรมไฟฟ้าและคอมพิวเตอร์ คณะวิศวกรรมศาสตร์ มหาวิทยาลัยธรรมศาสตร์",
        144,
        273.92261111
    );
    doc
    .fontSize(fontsize)
    .text(
        "ได้กําหนดวิชาการฝึกงานทางวิศวกรรมไฟฟ้าไว้ในหลักสูตร โดยมีนโยบายที่จะส่งเสริมให้นักศึกษาชั้นปีที่  ๓",
        93.390861224,
        291.23694444
    );
    doc
    .fontSize(fontsize)
    .text(
        "ได้มีประสบการณ์และความรอบรู้จากการทํางานจริง  ตลอดจนรู้จักใช้ความรู้จากการศึกษามาประยุกต์เข้ากับ",
        93.390861224,
        308.55480556
    );
    doc.fontSize(fontsize).text("การทํางาน", 93.390861224, 325.86913889);

    doc
    .fontSize(fontsize)
    .text(
        "ในการนี้ ภาควิชาฯจึงขอความอนุเคราะห์ให้นักศึกษา ดังรายนามต่อไปนี้",
        146.16994444,
        356
    );
    doc
    .fontSize(fontsize)
    .text(
        `๑.${data.student.name_title_th}${data.student.displayname_th}  เลขทะเบียน ${thaiString}    ${data.student.department}`,
        146.16994444,
        377.6
    );
    // doc
    // .fontSize(fontsize)
    // .text(
    //     "๒.นายxxxxx   xxxxxx  เลขทะเบียน xxxxxxxxxx    สาขาวิชาวิศวกรรมไฟฟ้ากําลัง",
    //     144,
    //     392
    // );
    doc
    .fontSize(fontsize)
    .text(
        `ได้มีโอกาสเข้าฝึกงานในหน่วยงานของท่าน ช่วงปิดภาคฤดูร้อน ระหว่างวันที่ ${lastSetup.start_date} ถึงวันที่ ${lastSetup.end_date}`,
        93.390861224,
        421.68
    );
    doc
    .fontSize(fontsize)
    .text(
        `${lastSetup.end_date_year}   (รวมเวลาฝึกงานไม่น้อยกว่า  ๒๔๐ ชั่วโมง) ภาควิชาฯ หวังเป็นอย่างยิ่งว่าจะได้รับความอนุเคราะห์`,
        93.390861224,
        437.96
    );
    doc.fontSize(fontsize).text("จากท่าน  ในครั้งนี้", 93.6, 456.896);
    doc
    .fontSize(fontsize)
    .text(
        "จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ด้วย จักขอบพระคุณยิ่ง",
        147.05894444,
        484.93072222
    );
    doc.fontSize(fontsize).text("ขอแสดงความนับถือ", 302.26705556, 513.19880556);
    doc.fontSize(fontsize).text(`(${lastSetup.head_name})`, 284.57172222, 592.64788889);
    doc.fontSize(fontsize).text("หัวหน้าภาควิชาวิศวกรรมไฟฟ้าและคอมพิวเตอร์", 259.23169444, 609.70822222);
    doc.fontSize(fontsize).text("ภาควิชาวิศวกรรมไฟฟ้าและคอมพิวเตอร์", 91.656, 644.605);
    doc.fontSize(fontsize).text("โทร. ๐ ๒๕๖๔ ๓๐๐๑-๙ ต่อ ๓๐๓๗", 91.656, 662.48730556);
    doc.fontSize(fontsize).text("โทรสาร ๐ ๒๕๖๔ ๓๐๒๑", 91.656, 680.83175);

    doc.addPage()
    ////////////////////////////////
    // lettern create nonlicense
    doc.fontSize(fontsize).text(`ที่ อว ๖๗.๓๐/(วฟ-${thisdate}-${number_letter})`, 93.390861224, 91.77838878);

    // insert image below +10
    doc.image(imagePath, 259.2, 40.184, { width: 80 });
    //y = -13
    doc.fontSize(fontsize).text("คณะวิศวกรรมไฟฟ้าและคอมพิวเตอร์", 367.34397222, 91.77838878);
    doc.fontSize(fontsize).text("คณะวิศวกรรมศาสตร์", 367.34397222, 108.71172211);
    doc.fontSize(fontsize).text("มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต", 367.34397222, 125.64505544);
    doc.fontSize(fontsize).text("อ.คลองหลวง จ.ปทุมธานี ๑๒๑๒๐", 367.34397222, 142.57838877);
    //y = -10
    doc.fontSize(fontsize).text(`${date}`, 259.99722222, 166.38888889);
    // y = -12
    doc
      .fontSize(fontsize)
      .text("เรื่อง    ขอส่งตัวนักศึกษาฝึกงานภาคฤดูร้อน", 93.390861224, 203.37952778);
    doc.fontSize(fontsize).text(`เรียน    ${name_to}`, 93.390861224, 222.51608333);
    doc.fontSize(fontsize).text("อ้างถึง  แบบตอบรับนักศึกษาฝึกงานภาคฤดูร้อน", 93.390861224, 242.46566667);
    
    //y = -11
    doc
      .fontSize(fontsize)
      .text("สิ่งที่ส่งมาด้วย   ๑. ใบบันทึกเวลาการฝึกงานของนักศึกษา จํานวน ๒ ชุด", 93.390861224, 263.41172222);
    doc
      .fontSize(fontsize)
      .text("๒. แบบประเมินผลการฝึกงาน จํานวน ๒ ชุด", 158.99341667, 281.11763889);
    doc
      .fontSize(fontsize)
      .text("๓. แบบสอบถามผู้ประกอบการ จํานวน ๑ ชุด", 158.99341667, 297.99452778);
    //y = -7
    doc
      .fontSize(fontsize)
      .text("ตามที่อ้างถึง หน่วยงานของท่านได้ให้ความอนุเคราะห์ตอบรับนักศึกษา ภาควิชาวิศวกรรมไฟฟ้าและ", 149.29908333, 324.64286111);
    doc
      .fontSize(fontsize)
      .text("คอมพิวเตอร์  คณะวิศวกรรมศาสตร์  มหาวิทยาลัยธรรมศาสตร์  เข้ารับการฝึกงานภาคฤดูร้อน  ประจําปีการศึกษา", 93.390861224, 341.8055);
    doc
      .fontSize(fontsize)
      .text(`${convertStringToThaiNumber(semesterYear)} ระหว่างวันที่  ${lastSetup.start_date}  ถึงวันที่ ${lastSetup.end_date}  ${lastSetup.end_date_year}  (รวมเวลาไม่น้อยกว่า ๒๔๐ ชั่วโมง) แล้วนั้น`, 93.390861224, 359.20802778);
    // y = -7
    doc
      .fontSize(fontsize)
      .text("ภาควิชาฯ จึงขอส่งตัวนักศึกษา เข้าฝึกงานกับหน่วยงานของท่าน ดังรายชื่อต่อไปนี้", 149.29908333, 387.62075);
    
    doc
      .fontSize(fontsize)
      .text(`๑.${data.student.name_title_th}${data.student.displayname_th}  เลขทะเบียน ${thaiString}    ${data.student.department}`, 120.85108333, 407.55975);
    //y=-4
    doc
      .fontSize(fontsize)
      .text("อนึ่ง ภาควิชาฯ ได้จัดส่งเอกสารเพื่อประกอบการฝึกงานดังนี้", 149.29908333, 456.27622222);
    
    doc
      .fontSize(fontsize)
      .text("๑. ใบบันทึกการลงเวลาการฝึกงานของนักศึกษา สําหรับให้นักศึกษาลงเวลาการเข้าฝึกงาน", 120.85108333, 473.53763889);
    doc
      .fontSize(fontsize)
      .text("และขอความกรุณาผู้ควบคุมการฝึกงานลงนามท้ายใบบันทึกการลงเวลา", 132.52097222, 490.80258333);
    
    doc
      .fontSize(fontsize)
      .text("๒. แบบประเมินผลการฝึกงานให้ผู้ควบคุมการฝึกงานเป็นผู้ประเมิน", 120.85108333, 508.31094444);
    doc
      .fontSize(fontsize)
      .text("๓. แบบสอบถามผู้ประกอบการขอความกรุณาผู้ประกอบการให้ความเห็น", 120.85108333, 525.36775);
    doc
      .fontSize(fontsize)
      .text("จึงเรียนมาเพื่อโปรดทราบ และขอขอบพระคุณในความร่วมมือของท่านมา ณ โอกาสนี้", 149.29908333, 548.01608333);
      // y = -4
    doc.fontSize(fontsize).text("ขอแสดงความนับถือ", 303.55469444, 570.84433333);
   
    doc.fontSize(fontsize).text(`(${lastSetup.head_name})`, 274.94088889, 628.3965);
    doc.fontSize(fontsize).text("หัวหน้าภาควิชาวิศวกรรมไฟฟ้าและคอมพิวเตอร์", 255.86619444, 645.49916667);
     // y = -5
    doc.fontSize(12).text("สํานักงานภาควิชาฯ", 93.390861224, 674.085);
    doc.fontSize(12).text("โทร. ๐ ๒๕๖๔ ๓๐๐๑-๕ ต่อ ๓๐๓๗ (คุณบุญเรือน)", 93.390861224, 688.88402778);
    doc.fontSize(12).text("โทรสาร ๐๒๕๖๔ ๓๐๒๑", 93.390861224, 703.68305556);
    
    doc.end();
  
}