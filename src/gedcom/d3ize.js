// Tag search function
const hasTag = (val) => {
  return (node) => {
    return node.tag === val
  }
}

// Data search function
const hasData = (val) => {
  return (node) => {
    return node.data === val
  }
}

// ID search function
const hasID = (val) => {
  return (node) => {
    return node.id === val
  }
}

const assignFy = (peopleNodes, links) => {
  // YOB known
  let yesyob = peopleNodes.filter((p) => {
    return p.yob !== "?" && !isNaN(+p.yob)
  })

  yesyob.forEach((p) => (p.fy = +p.yob))

  // YOB unknown
  let noyob = peopleNodes.filter((p) => {
    return p.yob === "?"
  })

  let count = 10

  // Cycle through list, adding fy until all complete
  while (noyob.length > 0 && count > 0) {
    let tempnoyob = noyob.slice()

    tempnoyob.forEach((p, index) => {
      // Build array of family
      let tpFamily = []

      links.forEach((link) => {
        if (link.source == p.id) {
          tpFamily.push({
            pRole: "source",
            pType: link.sourceType,
            other: link.target,
            oType: link.targetType,
          })
        } else if (link.target == p.id) {
          tpFamily.push({
            pRole: "target",
            pType: link.targetType,
            other: link.source,
            oType: link.sourceType,
          })
        }
      })

      // Check family for YOB
      tpFamily.forEach((member) => {
        // USE SOME() INSTEAD OF FOREACH!!!
        peopleNodes.forEach((person) => {
          // USE SOME() INSTEAD OF FOREACH!!!
          if (person.id == member.other && person.fy !== undefined) {
            // Person is source
            if (member.pRole === "source") {
              // Person is husband
              if (member.pType === "HUSB" && member.oType === "WIFE") {
                p.fy = +person.fy - 3

                // Person is father
              } else if (member.pType === "HUSB" && member.oType === "CHIL") {
                p.fy = +person.fy - 30

                // Person is mother
              } else if (member.pType === "WIFE") {
                p.fy = +person.fy - 27
              }

              // Person is target
            } else if (member.pRole === "target") {
              // Person is wife
              if (member.pType === "WIFE" && member.oType === "HUSB") {
                p.fy = +person.fy + 3

                // Person is child of father
              } else if (member.pType === "CHIL" && member.oType === "HUSB") {
                p.fy = +person.fy + 30

                // Person is child of mother
              } else if (member.pType === "CHIL" && member.oType === "WIFE") {
                p.fy = +person.fy + 27
              }
            }
          }
        })
      })
      if (p.fy !== undefined) {
        noyob.splice(index, index + 1)
      }
    })
    count -= 1
  }

  const convertFy = (peopleNodes) => {
    const fyRatio = (peopleNodes) => {
      if (peopleNodes.length <= 50) {
        return 3
      } else if (peopleNodes.length > 50 && peopleNodes.length <= 150) {
        return 4
      } else if (peopleNodes.length > 150 && peopleNodes.length <= 250) {
        return 5
      } else if (peopleNodes.length > 250) {
        return 6
      }
    }
    let allFy = []
    peopleNodes.forEach((p) => {
      if (p.fy !== undefined) {
        p.fy = p.fy * fyRatio(peopleNodes)
        allFy.push(p.fy)
      }
    })

    let total = 0
    allFy.forEach((fy) => (total += fy))
    let average = total / allFy.length

    peopleNodes.forEach((p) => {
      if (p.fy !== undefined) {
        p.fy = -(p.fy - average)
      }
    })
  }
  convertFy(peopleNodes)
}

// Get title
const getTitle = (p) => {
  const title = p.tree.filter(hasTag("TITL")) || []
  if (title.length > 0) {
    return title[title.length - 1].data
  }
}

// Get full name
const getName = (p) => {
  let nameNode = (p.tree.filter(hasTag("NAME")) || [])[0]
  if (nameNode) {
    return nameNode.data.replace(/\//g, "")
  } else {
    return "?"
  }
}

// Get first name
const getFirstName = (p) => {
  const nameNode = (p.tree.filter(hasTag("NAME")) || [])[0]
  if (nameNode) {
    let firstNameNode = (nameNode.tree.filter(hasTag("GIVN")) || [])[0]
    if (firstNameNode) {
      if (firstNameNode.data.search(" ") !== -1) {
        return firstNameNode.data.slice(0, firstNameNode.data.search(" "))
      } else {
        return firstNameNode.data
      }
    } else {
      // Fallback: extract given name from NAME value (e.g. "Harry /Potter/")
      const nameData = nameNode.data || ""
      const slashIndex = nameData.indexOf("/")
      const givenPart = (slashIndex !== -1 ? nameData.slice(0, slashIndex) : nameData).trim()
      if (givenPart) {
        const spaceIndex = givenPart.indexOf(" ")
        return spaceIndex !== -1 ? givenPart.slice(0, spaceIndex) : givenPart
      }
      return "?"
    }
  } else {
    return "?"
  }
}

// Get surname
const getSurname = (p) => {
  const nameNode = (p.tree.filter(hasTag("NAME")) || [])[0]
  if (nameNode) {
    const surnameNode = (nameNode.tree.filter(hasTag("SURN")) || [])[0]

    if (surnameNode) {
      if (surnameNode.data.search(",") !== -1) {
        return surnameNode.data.slice(0, surnameNode.data.search(","))
      } else {
        return surnameNode.data
      }
    } else {
      let nameArr = nameNode.data.split(" ")

      let isSlashes = nameArr.some((str) => str[0] === "/")
      if (isSlashes) {
        return nameArr.find((str) => str[0] === "/").replace(/\//g, "")
      } else {
        nameArr[nameArr.length - 1] = nameArr[nameArr.length - 1].replace(
          /\//g,
          "",
        )
        return nameArr.length > 1 ? nameArr[nameArr.length - 1] : "Hrm"
      }
    }
  } else {
    return "?"
  }
}

// Get gender
const getGender = (p) => {
  let genderNode = (p.tree.filter(hasTag("SEX")) || [])[0]
  if (genderNode) {
    return genderNode.data
  } else {
    return "U"
  }
}

// Get date of birth
const getDOB = (p) => {
  let dobNode = (p.tree.filter(hasTag("BIRT")) || [])[0]
  if (dobNode) {
    let dateNode = (dobNode.tree.filter(hasTag("DATE")) || [])[0]
    if (dateNode) {
      return dateNode.data
    } else {
      return "?"
    }
  } else {
    return "?"
  }
}

// Extract a 4-digit year from a date string
const extractYear = (dateStr) => {
  const match = dateStr.match(/\b(\d{4})\b/)
  return match ? match[1] : "?"
}

// Get year of birth
const getYOB = (p) => {
  let dobNode = (p.tree.filter(hasTag("BIRT")) || [])[0]
  if (dobNode) {
    let dateNode = (dobNode.tree.filter(hasTag("DATE")) || [])[0]
    if (dateNode) {
      return extractYear(dateNode.data)
    } else {
      return "?"
    }
  } else {
    return "?"
  }
}

// Get place of birth
const getPOB = (p) => {
  let pobNode = (p.tree.filter(hasTag("BIRT")) || [])[0]
  if (pobNode) {
    let placeNode = (pobNode.tree.filter(hasTag("PLAC")) || [])[0]
    if (placeNode) {
      return placeNode.data
    } else {
      return ""
    }
  } else {
    return ""
  }
}

// Get date of death
const getDOD = (p) => {
  let dodNode = (p.tree.filter(hasTag("DEAT")) || [])[0]
  if (dodNode) {
    let dateNode = (dodNode.tree.filter(hasTag("DATE")) || [])[0]
    if (dateNode) {
      return dateNode.data
    } else {
      return "?"
    }
  } else {
    return "?"
  }
}

// Get year of death
const getYOD = (p) => {
  let thisYear = new Date().getFullYear()

  let dobNode = (p.tree.filter(hasTag("BIRT")) || [])[0]
  let dodNode = (p.tree.filter(hasTag("DEAT")) || [])[0]

  if (dodNode) {
    let dateNode = (dodNode.tree.filter(hasTag("DATE")) || [])[0]

    if (dateNode) {
      return extractYear(dateNode.data)
    } else {
      return "?"
    }
  } else if (dobNode && !dodNode) {
    let dateNode = (dobNode.tree.filter(hasTag("DATE")) || [])[0]

    if (dateNode) {
      let birthYear = extractYear(dateNode.data)
      if (birthYear !== "?" && Number(birthYear) < thisYear - 100) {
        return "?"
      } else {
        return "Present"
      }
    } else {
      return "?"
    }
  } else {
    return "?"
  }
}

// Get place of death
const getPOD = (p) => {
  let podNode = (p.tree.filter(hasTag("DEAT")) || [])[0]
  if (podNode) {
    let placeNode = (podNode.tree.filter(hasTag("PLAC")) || [])[0]
    if (placeNode) {
      return placeNode.data
    } else {
      return ""
    }
  } else {
    return ""
  }
}

// Get relatives
const getFamilies = (p) => {
  let families = []
  let pediInfo
  let familyNode1 = p.tree.filter(hasTag("FAMC")) || []
  if (familyNode1) {
    for (let i = 0; i < familyNode1.length; i++) {
      if (familyNode1[i].tree.length > 0) {
        if (familyNode1[i].tree[0].tag == "PEDI") {
          pediInfo = {
            frel: familyNode1[i].tree[0].data,
            mrel: familyNode1[i].tree[0].data,
          }
        } else if (familyNode1[i].tree[0].tag == "_FREL") {
          pediInfo = {
            frel: familyNode1[i].tree[0].data,
            mrel: familyNode1[i].tree[1].data,
          }
        }
      }

      families.push({ id: familyNode1[i].data, pedi: pediInfo })
    }
  }
  let familyNode2 = p.tree.filter(hasTag("FAMS")) || []
  if (familyNode2) {
    for (let i = 0; i < familyNode2.length; i++) {
      families.push({ id: familyNode2[i].data })
    }
  }
  return families
}

// Get color
const getColor = (p, surnameList) => {
  const colorList = [
    "#f6edd0", // cream
    "#f8a39e", // soft pink
    "#5bceff", // sky blue
    "#ffc32a", // mexican egg yolk
    "#8df0c2", // grass & sage
    "#d0a8ec", // soft royal purple
    "#ffa686", // coral
    "#adcdd8", // light blue grey
    "#a6b890", // olive sage
    "#e6f387", // olive
    "#eebf90", // light brown
    "#6e90e6", // ligt purple blue
    "#f8a7d0", // dry wine
    "#30f6d5", // sea foam
    "#be719d", // magenta
    "#e08e79", // blush
    "#80d152", // neon green
    "#9efde5", // light sea foam
    "#ff835a", // burnt orange
    "#eebd6e", // chocolate
    "#35f8a0", // forest
    "#f95162", // rouge
    "#d4ee5e", // lime
    "#e887aa", // newborn pink
    "#a178ea", // royal purple
    "#00c0de", // baby foam
  ]

  const dscr = (p.tree.filter(hasTag("DSCR")) || [])[0]

  const foundName = surnameList.find((sName) => sName.surname === p.surname)

  if (foundName) {
    foundName.count = foundName.count + 1
  } else {
    surnameList.push({
      surname: p.surname,
      count: 1,
      color: colorList[surnameList.length % colorList.length],
    })
  }

  if (dscr) {
    return dscr.data
  } else {
    return surnameList.find((sName) => sName.surname === p.surname).color
  }
}

// Get person notes
const getNotes = (p) => {
  return p.tree.filter(hasTag("NOTE"))
}

// Get Bio
const getBio = (p, notes) => {
  if (p.notes.length != 0) {
    let bio = ""

    p.notes.forEach((personNote) => {
      if (notes.length > 0) {
        notes.forEach((note) => {
          if (personNote.data === note.pointer) {
            bio += note.data

            if (note.tree.length > 0) {
              note.tree.forEach((fragment) => (bio += fragment.data))
            }
          }
        })
      } else {
        bio += personNote.data
      }
    })
    return bio
  }
}

const toNode = (p, notes, surnameList) => {
  p.id = p.pointer
  p.title = getTitle(p)
  p.name = getName(p)
  p.firstName = getFirstName(p)
  p.surname = getSurname(p)
  p.gender = getGender(p)
  p.dob = getDOB(p)
  p.yob = getYOB(p)
  p.pob = getPOB(p)
  p.dod = getDOD(p)
  p.yod = getYOD(p)
  p.pod = getPOD(p)
  p.families = getFamilies(p)
  p.color = getColor(p, surnameList)
  p.notes = getNotes(p)
  p.bio = getBio(p, notes)
  return p
}

const familyLinks = (family, peopleNodes) => {
  let memberLinks = []
  let maritalStatus = null

  let memberSet = family.tree.filter(function (member) {
    return (
      member.tag &&
      (member.tag === "HUSB" || member.tag === "WIFE" || member.tag === "CHIL")
    )
  })

  family.tree.filter((event) => {
    if (event.tag === "DIV" || event.tag === "MARR") {
      if (maritalStatus !== "DIV") {
        maritalStatus = event.tag
      }
    }
  })

  while (memberSet.length > 1) {
    for (let i = 1; i < memberSet.length; i++) {
      if (memberSet[0].tag != "CHIL") {
        if (memberSet[0].tag == "HUSB" && memberSet[i].tag == "WIFE") {
          memberLinks.push({
            source: memberSet[0].data,
            target: memberSet[i].data,
            sourceType: memberSet[0].tag,
            targetType: memberSet[i].tag,
            type: maritalStatus,
          })
        } else {
          function getPedigree(personID, parentType, relInfo) {
            let person = peopleNodes.filter(hasID(personID))
            let personFamily = person[0].families.filter(hasID(family.pointer))
            if (parentType == "HUSB") {
              if (personFamily[0].pedi) {
                return personFamily[0].pedi.frel
              } else if (relInfo.some((parent) => parent.tag === "_FREL")) {
                return relInfo.find((parent) => parent.tag === "_FREL").data
              }
            } else {
              if (personFamily[0].pedi) {
                return personFamily[0].pedi.mrel
              } else if (relInfo.some((parent) => parent.tag === "_MREL")) {
                return relInfo.find((parent) => parent.tag === "_MREL").data
              }
            }
          }

          memberLinks.push({
            source: memberSet[0].data,
            target: memberSet[i].data,
            sourceType: memberSet[0].tag,
            targetType: memberSet[i].tag,
            type: getPedigree(
              memberSet[i].data,
              memberSet[0].tag,
              memberSet[i].tree,
            ),
          })
        }
      }
    }
    memberSet.splice(0, 1)
  }
  return memberLinks
}

export function d3ize(tree) {
  const notes = tree.filter(hasTag("NOTE"))
  let surnameList = []
  const peopleNodes = tree
    .filter(hasTag("INDI"))
    .map((p) => toNode(p, notes, surnameList))
  const families = tree.filter(hasTag("FAM"))
  const links = families.reduce((memo, family) => {
    return memo.concat(familyLinks(family, peopleNodes))
  }, [])
  assignFy(peopleNodes, links)
  return {
    nodes: peopleNodes,
    links: links,
    families: families,
    surnameList: surnameList,
  }
}
