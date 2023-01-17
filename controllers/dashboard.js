const toolController = require('./tool.js')
const Tool = require('../models/tool')
c = {}

c.dashboard = async (req, res, next) => {
    let perPage = 10
    let page = req.query.p || 1
    let pageCount = 1

    // Chcek if tools have already been passed in from search
    if (req.body.tools) {
        return res.render('dashboard', {
            tools: req.body.tools,
            user: req.user,
    })}
    console.log(page)
    Tool.find({})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec(function (err, tools) {
            Tool.count().exec(function (err, count) {
                if (err) return next(err)
                res.render('dashboard', {
                    tools: tools,
                    user: req.user,
                    pagination: {
                        page: page,
                        pageCount: Math.ceil(count / perPage)
                    }
                })
            })
        })
}
module.exports = c