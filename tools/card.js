export default class Card {
    id
    name
    img
    tags

    constructor(id, name, img, tags) {
        this.id = id
        this.name = name
        this.img = img
        this.tags = new Set(tags)
    }
}
