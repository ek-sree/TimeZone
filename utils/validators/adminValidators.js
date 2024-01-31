const alphanumValid = (name) => {
    const nameRegex = /^(?! )[A-Za-z0-9, ' .]*(?<! )$/;
    return nameRegex.test(name);
}

const onlyNumbers = (str) => {
    const numbersOnlyRegex = /^[1-9][0-9]*(\.[0-9]+)?$/;
    return str.length > 0 && numbersOnlyRegex.test(str);
}

const zerotonine = (str) => {
    const numbersOnlyRegex = /^(0|[1-9][0-9]*)$/;
    return str.length > 0 && numbersOnlyRegex.test(str);
}

const uppercaseAlphanumValid = (input) => {
    const regex = /^[A-Z]*$/;
    return regex.test(input);
}


const isFutureDate = (selectedDate) => {
    const selectedDateTime = new Date(selectedDate);
    const currentDate = new Date();
    return selectedDateTime > currentDate;
}





module.exports={
    alphanumValid,
    onlyNumbers,
    zerotonine,
    uppercaseAlphanumValid,
    isFutureDate
}

