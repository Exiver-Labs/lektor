import PropTypes from "prop-types";
import React from "react";
import RecordComponent from "../components/RecordComponent";
import SlideDialog from "../components/SlideDialog";
import dialogSystem from "../dialogSystem";
import { trans } from "../i18n";

class ErrorDialog extends RecordComponent {
  onClose() {
    dialogSystem.dismissDialog();
  }

  render() {
    return (
      <SlideDialog hasCloseButton closeOnEscape title={trans("ERROR")}>
        <p>
          {trans("ERROR_OCURRED")}
          {": "}
          {trans("ERROR_" + this.props.error.code)}
        </p>
        <div className="actions">
          <button
            type="submit"
            className="btn btn-primary"
            onClick={this.onClose.bind(this)}
          >
            {trans("CLOSE")}
          </button>
        </div>
      </SlideDialog>
    );
  }
}

ErrorDialog.propTypes = {
  error: PropTypes.object,
};

export default ErrorDialog;
