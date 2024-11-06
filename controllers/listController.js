const List = require('../models/List')

const create_list = async (req, res) => {
    if (req.user.isAdmin) {
        const newList = new List(req.body)
        try {
            const savedList = await newList.save()
            res.status(200).json(savedList)

        } catch (error) {
            res.status(500).json(error)
        }
    } else {
        res.status(403).json("You are not allowded")
    }
}

const delete_list = async (req, res) => {
    if (req.user.isAdmin) {
        try {
            const deletedList = await List.findByIdAndDelete(req.params.id)
            res.status(200).json(deletedList)

        } catch (error) {
            res.status(500).json(error)
        }
    } else {
        res.status(403).json("You are not allowded")
    }
}
const update_list = async (req, res) => {
    if (req.user.isAdmin) {
        try {
            const updatedList = await List.findByIdAndUpdate(req.params.id, {
                $set: req.body
            }, { new: true })
            res.status(200).json(updatedList)

        } catch (error) {
            res.status(500).json(error)

        }

    } else {
        res.status(403).json("You are not allowded")

    }
}

const get_list = async (req, res) => {
    const typeQuery = req.query.type;
    const genreQuery = req.query.genre;
    let list = []
    try {

        if (typeQuery) {
            if (genreQuery) {
                list = await List.aggregate([
                    {
                        $sample: { size: 10 }
                    },
                    {
                        $match: {
                            type: typeQuery,
                            genre: { $in: [genreQuery] }
                        }
                    }
                ])
            } else {
                list = await List.aggregate([
                    {
                        $sample: { size: 10 }
                    },
                    {
                        $match: { type: typeQuery }
                    }
                ])
            }
        } else {
            list = await List.aggregate([
                {
                    $sample: { size: 10 }
                }
            ])
        }
        res.status(200).json(list)

    } catch (error) {
        res.status(500).json(error)
    }
}
const get_all_list = async (req, res) => {
    if (req.user.isAdmin) {
        try {
            const lists = await List.find()
            res.status(200).json(lists.reverse())

        } catch (error) {
            res.status(500).json(error)
        }

    } else {
        res.status(403).json("You are not allowded")

    }


}

const get_list_id = async (req, res) => {
    if (req.user.isAdmin) {

        try {
            const list = await List.findById(req.params.id)
            res.status(200).json(list)
        } catch (error) {
            res.status(500).json(error)
        }
    } else {
        res.status(403).json("You are not allowded")

    }
}





module.exports = {
    create_list,
    delete_list,
    get_list,
    get_all_list,
    get_list_id,
    update_list
}

