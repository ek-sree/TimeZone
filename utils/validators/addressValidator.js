const bnameValid = (fullname) => {
    const nameRegex = /^[A-Za-z]+$/;
    return fullname.length > 1 && nameRegex.test(fullname);
};

const adphoneValid = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
};

const pincodeValid = (pincode) => {
    const pincodeRegex = /^[0-9]{6}$/;
    return pincodeRegex.test(pincode);
};

module.exports = {
    bnameValid,
    adphoneValid,
    pincodeValid
};