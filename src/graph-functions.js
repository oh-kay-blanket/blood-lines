// Set camera distance based on # of nodes
const cameraDistance = (d3Data) => {
  const distanceRatio = (d3Data.nodes.length/2) * 12;
  if (distanceRatio < 450) {
    return 450;
  } else if (distanceRatio > 900) {
    return 900;
  } else {
    return distanceRatio;
  }
}

const setNodeLabel = node => {

  // Label setup
  let label = '<div class="node-label">';
  // Name
  if (node.title) {
    label += '<h4>' + node.name + ' (' + node.title + ')</h4>';
  } else if (node.firstName == '?') {
    label += '<h4>' + node.name + '</h4>';
  } else {
    label += '<h4>' + node.firstName + ' ' + node.surname + '</h4>';
  }
  // Lifespan
  label += '<p>' + node.yob + ' - ' + node.yod + '</p>';
  // Gender
  label += (node.gender === 'M') ? '<p>Male</p>' : '<p>Female</p>';
  // Birthplace
  if (node.pob != '') {
    label += '<p>Born: ' + node.pob + '</p>'
  }
  // Deathplace
  if (node.pod != '') {
    label += '<p>Died: ' + node.pod + '</p>'
  }
  // Bio
  if (node.bio) {
    label += '<p>' + node.bio + '</p>'
  }

  return label += '</div>';
}

const setLinkLabel = link => {
  // No state change
  switch(link.type) {
    case 'DIV':
      return '<div class="link-label"><p>Divorced</p></div>';
      break;
    case 'MARR':
      return '<div class="link-label"><p>Married</p></div>';
      break;
    case 'birth':
      return '<div class="link-label"><p>Birth</p></div>';
      break;
    case 'Step':
      return '<div class="link-label"><p>Step</p></div>';
      break;
    case 'Adopted':
      return '<div class="link-label"><p>Adopted</p></div>';
      break;
  }
}

export { cameraDistance, setNodeLabel, setLinkLabel };
