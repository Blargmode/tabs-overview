let selectedListIndex = -1
let tabList = document.querySelector('#tabs')
let closeBtn = document.querySelector('#close-btn')
let sortTitleBtn = document.querySelector('#sort-title-btn')
let sortUrlBtn = document.querySelector('#sort-url-btn')
let clearSortBtn = document.querySelector('#clear-sort-url')
let settings = {}

/**
 * Triggers ticking the boxes between two other checkboxes if shift was held when clicking the second one.
 * @param {MouseEvent} event 
 * @returns 
 */
function handleMultiSelect(event) {

    const previous = selectedListIndex
    const next = parseInt(event.target.dataset.listIndex)
    selectedListIndex = next

    // Abort if shift was not held or no selection has been made.
    if (!event.shiftKey || previous < 0) return

    if (next > previous) {
        selectBetween(previous, next, event.target.checked)
    } else if (next < previous) {
        selectBetween(next, previous, event.target.checked)
    }
    // Do nothing if ==
}

/**
 * Checks or unchecks all checkboxes that is the first child of a list item in the tabList list, if between the indexes, incluseive.
 * @param {number} startIndex 
 * @param {number} endIndex 
 * @param {boolean} checked 
 */
function selectBetween(startIndex, endIndex, checked) {
    let nodes = [ ...tabList.childNodes ]
    for (let i = 0; i < nodes.length; i++) {
        const listIndex = parseInt(nodes[i].dataset.listIndex)
        if (listIndex >= startIndex && listIndex <= endIndex) {
            nodes[i].children[0].checked = checked
        }
    }
}

/**
 * Gets the tabs and appends them to the page.
 */
function loadTabs(settings = null){

    // Cleanup first
    // Grabbing the checked IDs while removing the old 
    // list items to be able to preserve selection.
    let selectedIds = {} // Using object instead of array for easy lookup by ID.
    while (tabList.firstChild) {
        if (tabList.firstChild.childNodes[0].checked) {
            selectedIds[parseInt(tabList.firstChild.childNodes[0].value)] = true
        }
        tabList.removeChild(tabList.firstChild)
    }
    selectedListIndex = -1

    // Load tabs
    chrome.tabs.query({}, tabs => {

        let elements = []

        if (settings?.sortByUrl) {
            tabs = tabs.sort((a, b) => (a.url > b.url) ? 1 : -1)
        }
        if (settings?.sortByTitle) {
            tabs = tabs.sort((a, b) => (a.title > b.title) ? 1 : -1)
        }

        for (let i = 0; i < tabs.length; i++) {
            elements.push(createTabElement(tabs[i], i, selectedIds[tabs[i].id]))
        }

        tabList.append(...elements)
    })
}

/**
 * Creates a list item from a tab
 * @param {Tab} tab https://developer.chrome.com/docs/extensions/reference/tabs/#type-Tab
 * @param {number} listIndex 
 * @param {boolean} selected 
 * @returns {HTMLElement}
 */
function createTabElement(tab, listIndex, selected = false) {
    let li = document.createElement('li')
    let index = document.createElement('p')
    let title = document.createElement('h2')
    let url = document.createElement('p')
    let check = document.createElement('input')
    let img = document.createElement('img')

    if (tab.favIconUrl && tab.favIconUrl.startsWith('http')) {
        img.src = tab.favIconUrl
    }

    index.innerText = listIndex + 1
    li.dataset.listIndex = listIndex
    li.addEventListener('click', handleMultiSelect)
    title.innerText = tab.title
    url.innerText = tab.url
    check.dataset.listIndex = listIndex
    check.type = 'checkbox'
    check.value = tab.id
    check.name = 'tabs'
    check.checked = selected

    li.append(check)
    li.append(img)
    li.append(index)
    li.append(title)
    li.append(url)
    return li
}

// On click: close "checked" tabs
closeBtn.addEventListener('click', event => {
    event.preventDefault()
    let nodes = [ ...tabList.childNodes ]
    let ids = []
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].children[0].checked) {
            ids.push(parseInt(nodes[i].children[0].value))
        }
    }
    chrome.tabs.remove(ids, () => {
        // Reset tab list when done
        loadTabs()
    })


})

sortUrlBtn.addEventListener('click', event => {
    event.preventDefault()
    settings['sortByUrl'] = true
    settings['sortByTitle'] = false
    loadTabs(settings)
})

sortTitleBtn.addEventListener('click', event => {
    event.preventDefault()
    settings['sortByTitle'] = true
    settings['sortByUrl'] = false
    loadTabs(settings)
})

clearSortBtn.addEventListener('click', event => {
    event.preventDefault()
    settings['sortByTitle'] = false
    settings['sortByUrl'] = false
    loadTabs()
})

loadTabs()
