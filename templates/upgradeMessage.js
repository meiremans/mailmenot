exports.getTemplate = ({title, text, image}) => {
    return `
            <b>${title}</b>
            ${text}
            <a href="${image}"> </a>
           `
}