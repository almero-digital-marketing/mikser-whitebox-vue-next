function removeMetatext(content) {
    return (content || '').toString()
    .replaceAll('<','')
    .replaceAll('>','')
    .replaceAll('{','')
    .replaceAll('}','')
    .replaceAll('(','')
    .replaceAll(')','')
    .replaceAll('[','')
    .replaceAll(']','')
    .replaceAll('|',' ')
    .replaceAll('_',' ')
    .replaceAll('~',' ')
}

function metatext(content) {
    return (content || '').toString()
    .replaceAll('<','<<')
    .replaceAll('>','>>')
    .replaceAll('<<','<s>')
    .replaceAll('>>','</s>')
    .replaceAll('{','<u>')
    .replaceAll('}','</u>')
    .replaceAll('(','<b>')
    .replaceAll(')','</b>')
    .replaceAll('[','<i>')
    .replaceAll(']','</i>')
    .replaceAll('|','<br>')
    .replaceAll('_','<hr>')
    .replaceAll('~','&nbsp;')
}

export { removeMetatext, metatext }