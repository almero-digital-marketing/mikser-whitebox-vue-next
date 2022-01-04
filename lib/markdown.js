import MarkdownIt from 'markdown-it'

function markdown(source, options = {}) {
    let markdown = new MarkdownIt({
        html: true,
        breaks: true, 
    })
    if (options.plugins) {
        options.plugins.forEach(({ plugin, options }) => {
            markdown.use(plugin, options)
        })
    }
    return markdown.render(source || '')
}
export { markdown }
