import React, { useState, useEffect, useRef } from "react";

const Controls = ({
  d3Data,
  closeRoots,
  highlights,
  highlightedFamily,
  setHighlightedFamily,
  showingSurnames,
  setShowingSurnames,
  isMobile,
  theme,
  toggleTheme,
  nameFormat,
  setNameFormat,
  editMode,
  setEditMode,
  openEditPanel,
  photoStore,
  showPhotos,
  setShowPhotos,
  handleExportGed,
  handleExportGedz,
  addNode,
  setHighlights,
  controlsVisible,
  graphRef,
  buildNodeHighlights,
  updateFamilyColor,
  colorList,
}) => {
  const [sheetState, setSheetState] = useState('closed'); // 'closed' | 'peek' | 'expanded'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [nodeInfoData, setNodeInfoData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [colorPickerSurname, setColorPickerSurname] = useState(null);
  const settingsRef = useRef(null);
  const surnamesRef = useRef(null);
  const searchInputRef = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (highlights.node) {
      setNodeInfoData(highlights.node);
      setSearchOpen(false);
      setSearchQuery("");
      setShowSettings(false);
      setShowingSurnames(false);
      setColorPickerSurname(null);
      if (isMobile) {
        setSheetState('peek');
      } else {
        setSheetState('expanded');
      }
    } else if (nodeInfoData) {
      setSheetState('closed');
      const timer = setTimeout(() => {
        setNodeInfoData(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlights.node]);

  // Mobile bottom sheet touch drag handlers
  useEffect(() => {
    if (!isMobile) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    let startY = 0;
    let currentY = 0;
    let startTranslateY = 0;
    let isDragging = false;
    let touchHistory = [];

    const getSheetHeight = () => sheet.offsetHeight;

    const getTranslateYForState = (state) => {
      const height = getSheetHeight();
      if (state === 'closed') return height;
      if (state === 'peek') return height - 80;
      return 0; // expanded
    };

    const onTouchStart = (e) => {
      // In expanded state, only allow drag when scrolled to top and dragging down
      const expandedContent = sheet.querySelector('.node-info-expanded');
      if (sheetState === 'expanded' && expandedContent && expandedContent.scrollTop > 0) {
        return;
      }
      startY = e.touches[0].clientY;
      startTranslateY = getTranslateYForState(sheetState);
      isDragging = false;
      touchHistory = [{ y: startY, t: Date.now() }];
    };

    const onTouchMove = (e) => {
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      // In expanded state, only drag if pulling down from scroll top
      if (sheetState === 'expanded') {
        const expandedContent = sheet.querySelector('.node-info-expanded');
        if (expandedContent && expandedContent.scrollTop > 0) return;
        if (deltaY < 0 && !isDragging) return; // trying to scroll up content
      }

      if (!isDragging && Math.abs(deltaY) > 5) {
        isDragging = true;
        sheet.style.transition = 'none';
      }

      if (isDragging) {
        e.preventDefault();
        const newTranslateY = Math.max(0, startTranslateY + deltaY);
        sheet.style.transform = `translateY(${newTranslateY}px)`;
        touchHistory.push({ y: currentY, t: Date.now() });
        if (touchHistory.length > 5) touchHistory.shift();
      }
    };

    const onTouchEnd = () => {
      if (!isDragging) return;

      // Calculate velocity from touch history
      let velocity = 0;
      if (touchHistory.length >= 2) {
        const last = touchHistory[touchHistory.length - 1];
        const prev = touchHistory[0];
        const dt = last.t - prev.t;
        if (dt > 0) {
          velocity = (last.y - prev.y) / dt; // px/ms, positive = downward
        }
      }

      const height = getSheetHeight();
      const currentTranslate = startTranslateY + (currentY - startY);
      const VELOCITY_THRESHOLD = 0.5;

      sheet.style.transition = '';
      sheet.style.transform = '';

      // Fast flick detection
      if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
        if (velocity < 0) {
          // Flick up
          setSheetState('expanded');
        } else {
          // Flick down
          if (sheetState === 'expanded') {
            setSheetState('peek');
          } else {
            setSheetState('closed');
            setTimeout(() => setHighlights({}), 50);
          }
        }
        return;
      }

      // Position-based snapping
      const peekY = height - 80;
      if (currentTranslate > peekY * 0.7) {
        // Past 70% of peek position → close
        setSheetState('closed');
        setTimeout(() => setHighlights({}), 50);
      } else if (currentTranslate > peekY * 0.3) {
        // Between 30-70% → peek
        setSheetState('peek');
      } else {
        // Above 30% → expanded
        setSheetState('expanded');
      }
    };

    sheet.addEventListener('touchstart', onTouchStart, { passive: true });
    sheet.addEventListener('touchmove', onTouchMove, { passive: false });
    sheet.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      sheet.removeEventListener('touchstart', onTouchStart);
      sheet.removeEventListener('touchmove', onTouchMove);
      sheet.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile, sheetState, setHighlights]);

  // Close all panels except the one being opened
  const closeOtherPanels = (except) => {
    if (except !== 'search') { setSearchOpen(false); setSearchQuery(""); }
    if (except !== 'surnames') { setShowingSurnames(false); setColorPickerSurname(null); }
    if (except !== 'settings') { setShowSettings(false); }
  };

  const toggleSurnames = () => {
    if (!showingSurnames) {
      closeOtherPanels('surnames');
    }
    setShowingSurnames((prevState) => !prevState);
  };

  // Search results (computed inline, no graph re-render)
  const searchResults =
    searchQuery.length > 0
      ? d3Data.nodes
          .filter((n) => {
            const q = searchQuery.toLowerCase();
            return (
              (n.name && n.name.toLowerCase().includes(q)) ||
              (n.firstName && n.firstName.toLowerCase().includes(q)) ||
              (n.surname && n.surname.toLowerCase().includes(q))
            );
          })
          .slice(0, 8)
      : [];

  const handleSearchSelect = (node) => {
    setSearchQuery("");
    setSearchOpen(false);
    buildNodeHighlights(node);
    // Zoom camera to the selected node
    if (graphRef && graphRef.current) {
      const x = node.x || 0;
      const y = node.y ?? node.fy ?? 0;
      const z = node.z || 0;
      graphRef.current.cameraPosition({ x, y, z: z + 400 }, { x, y, z }, 1000);
    }
  };

  const toggleSearch = () => {
    if (searchOpen) {
      setSearchQuery("");
      setSearchOpen(false);
    } else {
      closeOtherPanels('search');
      setSearchOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  };

  function compareSurname(a, b) {
    if (a.surname < b.surname) return -1;
    if (a.surname > b.surname) return 1;
    return 0;
  }

  function compareCount(a, b) {
    if (a.count < b.count) return 1;
    if (a.count > b.count) return -1;
    return 0;
  }

  const surnameList = d3Data.surnameList
    .filter((name) => name.surname !== "")
    .sort(compareSurname)
    .sort(compareCount)
    .map((family, index) => (
      <div
        key={index}
        style={{ position: "relative", display: "inline-block" }}
      >
        <p
          style={{
            color: "#000",
            cursor: "pointer",
            backgroundColor: !highlightedFamily
              ? family.color
              : highlightedFamily === family.surname
                ? family.color
                : "#ccc",
            border: "1px solid #000",
            padding: ".15rem 0.4rem",
            borderRadius: "0.4rem",
            margin: "0.15rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: "0.9rem",
            width: "fit-content",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
          onClick={() =>
            highlightedFamily === family.surname
              ? setHighlightedFamily()
              : setHighlightedFamily(family.surname)
          }
        >
          <span
            onClick={(e) => {
              e.stopPropagation();
              setColorPickerSurname(
                colorPickerSurname === family.surname ? null : family.surname,
              );
            }}
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              border: "1.5px solid rgba(0,0,0,0.4)",
              background: family.color,
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
          {family.surname} ({family.count})
        </p>
        {colorPickerSurname === family.surname && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              zIndex: 20,
              background: "var(--grey-dark)",
              border: "1.5px solid var(--grey-light-soft)",
              borderRadius: "0.5rem",
              padding: "0.4rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              width: "180px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {colorList.map((c) => (
              <span
                key={c}
                onClick={() => {
                  updateFamilyColor(family.surname, c);
                  setColorPickerSurname(null);
                }}
                style={{
                  display: "inline-block",
                  width: "22px",
                  height: "22px",
                  borderRadius: "4px",
                  background: c,
                  cursor: "pointer",
                  border:
                    c === family.color
                      ? "2px solid var(--text)"
                      : "1px solid rgba(0,0,0,0.2)",
                  boxSizing: "border-box",
                }}
              />
            ))}
          </div>
        )}
      </div>
    ));

  const nodeInfoInsert = (node) => {
    const labelGender =
      node.gender === "M" ? "♂" : node.gender === "F" ? "♀" : "";
    const photo = photoStore && photoStore[node.id];

    return (
      <div id="node-info--content">
        {/* Drag handle - mobile only */}
        <div className="bottom-sheet-handle">
          <div className="bottom-sheet-handle-bar" />
        </div>
        {/* Peek section - always visible */}
        <div className="node-info-peek">
          {node.title ? (
            <h4 className="node-title">
              <span>
                {node.name} ({node.title})
              </span>{" "}
              {labelGender}
            </h4>
          ) : (
            <h4>
              <span>{node.name}</span> {labelGender}
            </h4>
          )}
          <p>
            <b>
              {node.yob} - {node.yod}
            </b>
          </p>
        </div>
        {/* Expanded section - hidden on mobile in peek state */}
        <div className={`node-info-expanded${sheetState === 'expanded' || !isMobile ? ' visible' : ''}`}>
          <button
            className="node-info-edit-icon"
            onClick={() => openEditPanel(node)}
            aria-label="Edit person"
          >
            <span className="material-icons-outlined">edit</span>
          </button>
          {photo && (
            <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              <img
                src={photo}
                alt={node.name}
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  objectPosition: "top",
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              />
            </div>
          )}
          {node.pob != "" && (
            <p>
              <b>From:</b> {node.pob}
            </p>
          )}
          {node.pod != "" && (
            <p>
              <b>Died:</b> {node.pod}
            </p>
          )}
          {node.bio && node.bio.split('\n\n').filter(Boolean).map((para, i) => <p key={i}>{para.replace(/\n/g, ' ').trim()}</p>)}
        </div>
      </div>
    );
  };

  const handleAddNewPerson = () => {
    const newNode = addNode({
      firstName: "New",
      surname: "Person",
      gender: "M",
    });
    closeOtherPanels('edit');
    setHighlights({ node: newNode, family: [newNode], links: [] });
    openEditPanel(newNode);
  };

  const settingsRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.5rem 0",
  };

  const settingsLabelStyle = {
    color: "var(--text)",
    fontSize: "0.9rem",
    margin: 0,
  };

  const pillBtnStyle = (active) => ({
    background: active ? "var(--text)" : "transparent",
    color: active ? "var(--grey-dark)" : "var(--text)",
    border: "1px solid var(--grey-light-soft)",
    borderRadius: "0.5rem",
    padding: "0.25rem 0.5rem",
    cursor: "pointer",
    fontSize: "0.85rem",
  });

  return (
    <div
      id="controls"
      className={controlsVisible ? "controls-visible" : "controls-hidden"}
    >
      <div
        id="back-button"
        onClick={closeRoots}
        style={{
          background: "var(--grey-dark)",
          color: "var(--text)",
          border: "1.5px solid var(--grey-light-soft)",
          borderRadius: "50px",
          padding: "8px",
          margin: "1rem",
          width: "1rem",
          height: "1rem",
          textAlign: "center",
          fontSize: ".8rem",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <span className="material-icons-outlined">close</span>
      </div>

      {showSettings && (
        <div className="menu-overlay" onClick={() => setShowSettings(false)} />
      )}
      {showingSurnames && (
        <div
          className="menu-overlay"
          onClick={() => {
            setShowingSurnames(false);
            setColorPickerSurname(null);
          }}
        />
      )}
      {searchOpen && (
        <div
          className="menu-overlay"
          onClick={() => {
            setSearchOpen(false);
            setSearchQuery("");
          }}
        />
      )}

      {/* Search button + expanding bar */}
      <div id="search" className={searchOpen ? "open" : ""}>
        <button id="search-button" onClick={toggleSearch} aria-label="Search">
          <span className="material-icons-outlined">search</span>
        </button>
        <div className="search-input-wrapper">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            tabIndex={searchOpen ? 0 : -1}
          />
          {searchQuery && (
            <span
              className="material-icons-outlined search-clear"
              onClick={() => setSearchQuery("")}
            >
              close
            </span>
          )}
        </div>
        {searchOpen && searchQuery.trim() && (
          <div className="search-results">
            {searchResults.length === 0 ? (
              <p className="search-no-results">no matches</p>
            ) : (
              searchResults.map((person) => (
                <div
                  key={person.id}
                  className="search-result-item"
                  onClick={() => handleSearchSelect(person)}
                >
                  <span
                    className="search-result-dot"
                    style={{ background: person.color }}
                  />
                  <span className="search-result-name">
                    {person.name} {person.yob ? `(${person.yob})` : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Settings gear button + dropdown */}
      <div id="settings" ref={settingsRef}>
        <button
          id="settings-button"
          className={showSettings ? "active" : ""}
          onClick={() => {
            if (!showSettings) closeOtherPanels('settings');
            setShowSettings((prev) => !prev);
          }}
          aria-label="Settings"
        >
          <i className="fa fa-cog" aria-hidden="true"></i>
        </button>

        {showSettings && (
          <div id="settings-dropdown">
            <p className="control-title" style={{ color: "var(--text)" }}>settings</p>
            <hr className="settings-divider" />
            {/* Theme */}
            <div style={settingsRowStyle}>
              <p style={settingsLabelStyle}>Theme</p>
              <button
                className="theme-toggle-slider"
                onClick={toggleTheme}
                aria-label="Toggle color mode"
              >
                <span
                  className={theme === "dark" ? "active" : ""}
                  aria-label="Dark"
                >
                  <span className="material-icons-outlined">dark_mode</span>
                </span>
                <span
                  className={theme === "light" ? "active" : ""}
                  aria-label="Light"
                >
                  <span className="material-icons-outlined">light_mode</span>
                </span>
                <span
                  className="slider"
                  style={{ left: theme === "dark" ? 0 : 33 }}
                ></span>
              </button>
            </div>

            <hr className="settings-divider" />

            {/* Name Format */}
            <div style={settingsRowStyle}>
              <p style={settingsLabelStyle}>Names</p>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  onClick={() => setNameFormat("firstLast")}
                  style={pillBtnStyle(nameFormat === "firstLast")}
                >
                  First Last
                </button>
                <button
                  onClick={() => setNameFormat("lastFirst")}
                  style={pillBtnStyle(nameFormat === "lastFirst")}
                >
                  Last, First
                </button>
              </div>
            </div>

            {Object.keys(photoStore).length > 0 && (
              <>
                <hr className="settings-divider" />
                <div style={settingsRowStyle}>
                  <p style={settingsLabelStyle}>Photos</p>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      onClick={() => setShowPhotos(true)}
                      style={pillBtnStyle(showPhotos)}
                    >
                      On
                    </button>
                    <button
                      onClick={() => setShowPhotos(false)}
                      style={pillBtnStyle(!showPhotos)}
                    >
                      Off
                    </button>
                  </div>
                </div>
              </>
            )}

            <hr className="settings-divider" />

            {/* + Person */}
            <div style={settingsRowStyle}>
              <button
                onClick={handleAddNewPerson}
                style={{
                  ...pillBtnStyle(false),
                  width: "100%",
                  textAlign: "center",
                  padding: "0.4rem 0.5rem",
                }}
              >
                + person
              </button>
            </div>

            <hr className="settings-divider" />

            {/* Export */}
            <div style={{ padding: "0.5rem 0" }}>
              <p style={{ ...settingsLabelStyle, marginBottom: "0.4rem" }}>
                Export
              </p>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  onClick={() => {
                    handleExportGed();
                    setShowSettings(false);
                  }}
                  style={pillBtnStyle(false)}
                  title="Genealogical data only"
                >
                  .ged
                </button>
                <button
                  onClick={() => {
                    handleExportGedz();
                    setShowSettings(false);
                  }}
                  style={pillBtnStyle(false)}
                  title="Genealogical data + photos"
                >
                  .gedz
                </button>
              </div>
              <p
                style={{
                  color: "var(--text)",
                  fontSize: "0.75rem",
                  opacity: 0.7,
                  marginTop: "0.35rem",
                }}
              >
                use .gedz to include photos
              </p>
            </div>

            <hr className="settings-divider" />

            {/* Controls help */}
            <div style={{ padding: "0.5rem 0" }}>
              <p className="control-title" style={{ color: "var(--text)" }}>
                controls
              </p>
              {isMobile ? (
                <>
                  <p style={{ color: "var(--text)" }}>
                    tap on name: person info
                  </p>
                  <p style={{ color: "var(--text)" }}>pinch: zoom</p>
                  <p style={{ color: "var(--text)" }}>swipe: rotate</p>
                  <p style={{ color: "var(--text)" }}>two-finger swipe: pan</p>
                </>
              ) : (
                <>
                  <p style={{ color: "var(--text)" }}>
                    click on name: person info
                  </p>
                  <p style={{ color: "var(--text)" }}>scroll: zoom</p>
                  <p style={{ color: "var(--text)" }}>
                    left-click drag: rotate
                  </p>
                  <p style={{ color: "var(--text)" }}>right-click drag: pan</p>
                </>
              )}
            </div>

            <hr className="settings-divider" />

            {/* Legend */}
            <div style={{ padding: "0.5rem 0" }}>
              <p className="control-title" style={{ color: "var(--text)" }}>
                legend
              </p>
              <div className="legend-line">
                <span
                  style={{
                    display: "inline-block",
                    width: "20px",
                    height: "0px",
                    borderTop: `2px solid ${theme === "light" ? "rgba(220, 80, 80, 0.45)" : "rgba(252, 103, 103, 0.7)"}`,
                    marginRight: "4px",
                    flexShrink: 0,
                  }}
                />
                <p style={{ color: "var(--text)" }}>- blood line</p>
              </div>
              <div className="legend-line">
                <span
                  style={{
                    display: "inline-block",
                    width: "20px",
                    height: "0px",
                    borderTop: `2px dashed ${theme === "light" ? "rgb(230, 180, 30)" : "rgb(255, 200, 0)"}`,
                    marginRight: "4px",
                    flexShrink: 0,
                  }}
                />
                <p style={{ color: "var(--text)" }}>- love line</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        id="node-info"
        ref={sheetRef}
        className={isMobile ? `sheet-${sheetState}` : (sheetState !== 'closed' ? 'visible' : '')}
      >
        {nodeInfoData && (
          <div
            style={{
              background: nodeInfoData.color,
              color: "var(--text)",
              border: "1.5px solid var(--grey-light-soft)",
              borderRadius: isMobile ? "1rem 1rem 0 0" : "1rem",
              padding: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            {nodeInfoInsert(nodeInfoData)}
          </div>
        )}
      </div>

      <div id="surnames" ref={surnamesRef}>
        <button
          id="surnames-button"
          className={showingSurnames ? "active" : ""}
          onClick={toggleSurnames}
          aria-label="Filter by surname"
        >
          <span className="material-icons-outlined">filter_list</span>
        </button>
        {showingSurnames && (
          <div
            className="surnames-content"
            style={{
              background: "var(--grey-dark)",
              color: "var(--text)",
              border: "1.5px solid var(--grey-light-soft)",
            }}
          >
            <p className="control-title" style={{ color: "var(--text)" }}>filter</p>
            {surnameList}
          </div>
        )}
      </div>
    </div>
  );
};

export default Controls;
