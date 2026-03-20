import React, { useState } from "react";
import SampleButton from "./SampleButton";
import faviconSvg from "./img/favicon.svg";
import ohKayImg from "./img/oh-kay.png";

const Load = ({
  handleUpload,
  startNewPlot,
  samples,
  showError,
  theme,
  toggleTheme,
}) => {
  const [showGedcomModal, setShowGedcomModal] = useState(false);
  const [showSamples, setShowSamples] = useState(false);

  return (
    <>
      <div id="load">
        <div>
          <section className="title-area">
            <img
              src={faviconSvg}
              alt="family plot logo"
              className="homepage-logo"
            />
            <h1>family plot</h1>
            <p>a 3D visualizer for genealogical data</p>
          </section>

          <section className="actions-area">
            <div className="action-card" onClick={startNewPlot}>
              <span className="material-icons-outlined action-icon">
                add_circle_outline
              </span>
              <h2>start new</h2>
              <p>create a family plot from scratch</p>
            </div>

            <label className="action-card" htmlFor="file-input">
              <span className="material-icons-outlined action-icon">
                upload_file
              </span>
              <h2>upload a file</h2>
              <p className="upload-desc">
                import a .ged or .gedz file
                <button
                  className="info-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowGedcomModal(true);
                  }}
                  aria-label="What is a GEDCOM file?"
                >
                  <span className="material-icons-outlined">info</span>
                </button>
              </p>
              <input
                id="file-input"
                type="file"
                name="gedFile"
                onChange={handleUpload}
              />
            </label>

            <div
              className="action-card"
              onClick={() => setShowSamples((prev) => !prev)}
            >
              <svg
                className="action-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                fill="currentColor"
              >
                <path d="M373.5-103.5Q330-147 330-210q0-52 31-91.5t79-53.5v-85H200v-160H100v-280h280v280H280v80h400v-85q-48-14-79-53.5T570-750q0-63 43.5-106.5T720-900q63 0 106.5 43.5T870-750q0 52-31 91.5T760-605v165H520v85q48 14 79 53.5t31 91.5q0 63-43.5 106.5T480-60q-63 0-106.5-43.5Zm396-597Q790-721 790-750t-20.5-49.5Q749-820 720-820t-49.5 20.5Q650-779 650-750t20.5 49.5Q691-680 720-680t49.5-20.5ZM180-680h120v-120H180v120Zm349.5 519.5Q550-181 550-210t-20.5-49.5Q509-280 480-280t-49.5 20.5Q410-239 410-210t20.5 49.5Q451-140 480-140t49.5-20.5ZM240-740Zm480-10ZM480-210Z" />
              </svg>
              <h2>explore samples</h2>
              <p>view famous family plots</p>
            </div>

            {showSamples && (
              <div className="sample-overlay">
                <h2 className="sample-overlay-heading">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 -960 960 960"
                    fill="currentColor"
                  >
                    <path d="M373.5-103.5Q330-147 330-210q0-52 31-91.5t79-53.5v-85H200v-160H100v-280h280v280H280v80h400v-85q-48-14-79-53.5T570-750q0-63 43.5-106.5T720-900q63 0 106.5 43.5T870-750q0 52-31 91.5T760-605v165H520v85q48 14 79 53.5t31 91.5q0 63-43.5 106.5T480-60q-63 0-106.5-43.5Zm396-597Q790-721 790-750t-20.5-49.5Q749-820 720-820t-49.5 20.5Q650-779 650-750t20.5 49.5Q691-680 720-680t49.5-20.5ZM180-680h120v-120H180v120Zm349.5 519.5Q550-181 550-210t-20.5-49.5Q509-280 480-280t-49.5 20.5Q410-239 410-210t20.5 49.5Q451-140 480-140t49.5-20.5ZM240-740Zm480-10ZM480-210Z" />
                  </svg>
                  sample plots
                </h2>
                <button
                  className="sample-overlay-close"
                  onClick={() => setShowSamples(false)}
                  aria-label="Close samples"
                >
                  <span className="material-icons-outlined">close</span>
                </button>
                {samples.map((sample) => (
                  <SampleButton
                    key={sample.name}
                    name={sample.name}
                    loadFile={sample.load}
                  />
                ))}
              </div>
            )}
          </section>

          {showError && (
            <p className="error">
              file type not supported. please use a .ged or .gedz file.
            </p>
          )}

          <section className="links-area">
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
            <a
              href="https://github.com/oh-kay-blanket/family-plot"
              aria-label="GitHub"
            >
              <i className="fab fa-github"></i>
            </a>
            <a href="https://ohkaycomputer.com" aria-label="Oh, Kay">
              <img src={ohKayImg} alt="Oh, Kay" className="oh-kay-icon" />
            </a>
          </section>
        </div>
      </div>

      {showGedcomModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowGedcomModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowGedcomModal(false)}
            >
              <span className="material-icons-outlined">close</span>
            </button>
            <h2>what is a GEDCOM file?</h2>
            <p>
              <strong>GEDCOM</strong> (Genealogical Data Communication) is a
              standard file format for exchanging genealogical data between
              different family tree software programs.
            </p>
            <p>
              GEDCOM files have a <strong>.ged</strong> extension and contain
              information about individuals, families, relationships, birth
              dates, death dates, and other genealogical data.
            </p>

            <h3>how to create a GEDCOM file</h3>
            <p>
              Most family tree software can export your data as a GEDCOM file:
            </p>

            <div className="gedcom-programs">
              <div className="program">
                <strong>Ancestry</strong>
                <p>Trees → Settings → Export tree → Download GEDCOM file</p>
              </div>

              <div className="program">
                <strong>MyHeritage</strong>
                <p>Family Tree → Manage tree → Export to GEDCOM</p>
              </div>

              <div className="program">
                <strong>FamilySearch</strong>
                <p>Family Tree → Download → GEDCOM</p>
              </div>

              <div className="program">
                <strong>Legacy Family Tree</strong>
                <p>File → Export → GEDCOM File</p>
              </div>

              <div className="program">
                <strong>Gramps</strong>
                <p>Family Trees → Export → GEDCOM</p>
              </div>

              <div className="program">
                <strong>RootsMagic</strong>
                <p>File → Export → Individual or Family</p>
              </div>
            </div>

            <p className="modal-note">
              Once you have your GEDCOM file, simply upload it using the file
              selector above to visualize your family tree in 3D.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Load;
