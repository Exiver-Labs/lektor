import React from "react";
import RecordComponent from "../components/RecordComponent";
import { loadData, getParentFsPath } from "../utils";
import { trans } from "../i18n";
import hub from "../hub";
import { AttachmentsChangedEvent } from "../events";
import { bringUpDialog } from "../richPromise";

class DeletePage extends RecordComponent {
  constructor(props) {
    super(props);

    this.state = {
      recordInfo: null,
      deleteMasterRecord: true,
    };
  }

  componentDidMount() {
    this.syncDialog();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.path !== this.props.match.params.path) {
      this.syncDialog();
    }
  }

  syncDialog() {
    loadData("/recordinfo", { path: this.getRecordPath() }).then((resp) => {
      this.setState({
        recordInfo: resp,
        deleteMasterRecord: this.isPrimary(),
      });
    }, bringUpDialog);
  }

  deleteRecord(event) {
    const path = this.getRecordPath();
    const parent = getParentFsPath(path);
    let targetPath;
    if (parent === null) {
      targetPath = "root";
    } else {
      targetPath = this.getUrlRecordPathWithAlt(parent);
    }

    loadData(
      "/deleterecord",
      {
        path: path,
        alt: this.getRecordAlt(),
        delete_master: this.state.deleteMasterRecord ? "1" : "0",
      },
      { method: "POST" }
    ).then((resp) => {
      if (this.state.recordInfo.is_attachment) {
        hub.emit(
          new AttachmentsChangedEvent({
            recordPath: this.getParentRecordPath(),
            attachmentsRemoved: [this.state.recordInfo.id],
          })
        );
      }
      this.transitionToAdminPage("edit", targetPath);
    }, bringUpDialog);
  }

  cancelDelete(event) {
    const urlPath = this.getUrlRecordPathWithAlt();
    this.transitionToAdminPage("edit", urlPath);
  }

  onDeleteAllAltsChange(event) {
    this.setState({
      deleteMasterRecord: event.target.value === "1",
    });
  }

  isPrimary() {
    return this.getRecordAlt() === "_primary";
  }

  render() {
    const ri = this.state.recordInfo;

    if (!ri || !ri.can_be_deleted) {
      return null;
    }

    const elements = [];
    let children = [];
    const alts = [];
    let attachments = [];
    let altInfo = null;
    let altCount = 0;

    for (let i = 0; i < ri.alts.length; i++) {
      if (ri.alts[i].alt === this.getRecordAlt()) {
        altInfo = ri.alts[i];
      }
      if (ri.alts[i].exists) {
        altCount++;
      }
    }

    if (ri.is_attachment) {
      elements.push(
        <p key="attachment">
          {this.isPrimary()
            ? trans("DELETE_ATTACHMENT_PROMPT")
            : trans("DELETE_ATTACHMENT_ALT_PROMPT")}{" "}
        </p>
      );
    } else {
      elements.push(
        <p key="child-info">
          {this.isPrimary()
            ? trans("DELETE_PAGE_PROMPT")
            : trans("DELETE_PAGE_ALT_PROMPT")}{" "}
          {ri.children.length > 0 && this.isPrimary()
            ? trans("DELETE_PAGE_CHILDREN_WARNING")
            : null}
        </p>
      );

      if (ri.children.length > 0) {
        children = ri.children.map((child) => {
          return <li key={child.id}>{trans(child.label_i18n)}</li>;
        });
        if (ri.child_count > children.length) {
          children.push(<li key="...">...</li>);
        }
      }

      attachments = ri.attachments.map((atch) => {
        return (
          <li key={atch.id}>
            {atch.id} ({atch.type})
          </li>
        );
      });
    }

    if (altCount > 1 && this.getRecordAlt() === "_primary") {
      ri.alts.forEach((item) => {
        if (!item.exists) {
          return;
        }
        let title = trans(item.name_i18n);
        if (item.is_primary) {
          title += " (" + trans("PRIMARY_ALT") + ")";
        } else if (item.primary_overlay) {
          title += " (" + trans("PRIMARY_OVERLAY") + ")";
        }
        alts.push(<li key={item.alt}>{title}</li>);
      });
      elements.push(
        <p key="alt-warning">{trans("DELETE_PRIMARY_ALT_INFO")}</p>
      );
      elements.push(
        <ul key="delete-all-alts">
          <li>
            <input
              type="radio"
              id="delete-all-alts"
              value="1"
              name="delete-master-record"
              checked={this.state.deleteMasterRecord}
              onChange={this.onDeleteAllAltsChange.bind(this)}
            />{" "}
            <label htmlFor="delete-all-alts">
              {trans(
                ri.is_attachment
                  ? "DELETE_ALL_ATTACHMENT_ALTS"
                  : "DELETE_ALL_PAGE_ALTS"
              )}
            </label>
          </li>
          <li>
            <input
              type="radio"
              id="delete-only-this-alt"
              value="0"
              name="delete-master-record"
              checked={!this.state.deleteMasterRecord}
              onChange={this.onDeleteAllAltsChange.bind(this)}
            />{" "}
            <label htmlFor="delete-only-this-alt">
              {trans(
                ri.is_attachment
                  ? "DELETE_ONLY_PRIMARY_ATTACHMENT_ALT"
                  : "DELETE_ONLY_PRIMARY_PAGE_ALT"
              )}
            </label>
          </li>
        </ul>
      );
    }

    let label = ri.label_i18n ? trans(ri.label_i18n) : ri.id;
    if (this.getRecordAlt() !== "_primary" && altInfo != null) {
      label += " (" + trans(altInfo.name_i18n) + ")";
    }

    return (
      <div>
        <h2>{trans("DELETE_RECORD").replace("%s", label)}</h2>
        {elements}
        <div
          style={{
            display:
              this.state.deleteMasterRecord && alts.length > 0
                ? "block"
                : "none",
          }}
        >
          <h4>{trans("ALTS_TO_BE_DELETED")}</h4>
          <ul>{alts}</ul>
        </div>
        <div
          style={{
            display:
              this.state.deleteMasterRecord && children.length > 0
                ? "block"
                : "none",
          }}
        >
          <h4>{trans("CHILD_PAGES_TO_BE_DELETED")}</h4>
          <ul>{children}</ul>
        </div>
        <div
          style={{
            display:
              this.state.deleteMasterRecord && attachments.length > 0
                ? "block"
                : "none",
          }}
        >
          <h4>{trans("ATTACHMENTS_TO_BE_DELETED")}</h4>
          <ul>{attachments}</ul>
        </div>
        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={this.deleteRecord.bind(this)}
          >
            {trans("YES_DELETE")}
          </button>
          <button
            className="btn btn-default"
            onClick={this.cancelDelete.bind(this)}
          >
            {trans("NO_CANCEL")}
          </button>
        </div>
      </div>
    );
  }
}

export default DeletePage;
