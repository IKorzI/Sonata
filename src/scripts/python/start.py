import json
import sys
import re
import os

from session import (
    session_PackageOfDocuments,
    session_EmptyStart,
    session_ReportStart,
    session_DebtorsStart,
)
from hours import hours_BasedOnTheFirstMonth, hours_SummaryOfTeachers
from other import extend_image, other_NumDenStart


def test_save_info(data):
    """
    Saves data to a local JSON file for testing.

    Args:
        data (dict): The data to be saved.
    """
    file_path = os.path.join(os.path.dirname(__file__), "data.json")

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

        print(f"File successfully saved at: {file_path}")
    except Exception as e:
        print(f"An error occurred while saving: {e}")


def camel_to_snake(name):
    """
    Converts a string from camelCase to snake_case, handling specific abbreviations.

    Args:
        name (str): The string to convert.
    Returns:
        str: The converted string in snake_case format (or original if no change is needed).
    """
    if not name:
        return name

    if not re.match(r"^[a-zA-Z]", name):
        return name

    # Keep strings consisting only of uppercase letters and digits unchanged
    if re.match(r"^[A-Z0-9]+$", name):
        return name

    # Separate lowercase letters from uppercase
    name = re.sub(r"([a-z])([A-Z])", r"\1_\2", name)

    # Separate lowercase letters from digits
    name = re.sub(r"([a-z])([0-9])", r"\1_\2", name)

    # Separate digits from uppercase letters
    name = re.sub(r"([0-9])([A-Z])", r"\1_\2", name)

    # Separate abbreviations (except cases where the new word is just the letter 's')
    name = re.sub(r"([A-Z]+)([A-Z][a-z]{2,}|[A-Z][a-rt-z])", r"\1_\2", name)

    parts = name.split("_")
    processed_parts = []

    for part in parts:
        if not part:
            continue

        # Keep original case for abbreviations and digit combinations
        if part.isupper() and len(part) >= 2:
            processed_parts.append(part)

        # Keep original case for plural abbreviations (e.g., ZXCs)
        elif re.match(r"^([A-Z]{2,}|[A-Z]+[0-9]+)s$", part):
            processed_parts.append(part)

        # Convert the rest to lowercase
        else:
            processed_parts.append(part.lower())

    return "_".join(processed_parts)


def decamelize_dict(data):
    """
    Recursively converts all dictionary keys or list items to snake_case.

    Args:
        data (dict | list | any): The data structure to process.
    Returns:
        dict | list | any: Data with converted keys.
    """
    if isinstance(data, dict):
        return {
            camel_to_snake(key): decamelize_dict(value) for key, value in data.items()
        }
    elif isinstance(data, list):
        return [decamelize_dict(item) for item in data]
    else:
        return data


if __name__ == "__main__":
    import sys
    import json
    import traceback

    sys.stdout.reconfigure(encoding="utf-8")
    sys.stdin.reconfigure(encoding="utf-8")

    up2 = sys.argv[1] if len(sys.argv) > 1 else None

    while True:
        try:
            line = sys.stdin.readline()

            if not line:
                break

            line = line.strip()
            if not line:
                continue

            raw_request = json.loads(line)
            request = decamelize_dict(raw_request)

            req_id = request.get("req_id")
            is_test = request.get("is_test", False)
            data = request.get("data", {})

            if is_test:
                test_save_info(data)

            result = None

            if data["id"] == "session--package-of-documents":
                result = session_PackageOfDocuments(data, up2)
            elif data["id"] == "session--empty-statements":
                result = session_EmptyStart(data, up2)
            elif data["id"] == "session--report":
                result = session_ReportStart(data, up2)
            elif data["id"] == "session--debtors":
                result = session_DebtorsStart(data, up2)
            elif data["id"] == "hours--based-on-the-first-month":
                result = hours_BasedOnTheFirstMonth(data, up2)
            elif data["id"] == "hours--summary-of-teachers":
                result = hours_SummaryOfTeachers(data, up2)
            elif data["id"] == "other--other--screenshot--transform":
                path = data["temp_path"]
                final_path = data["final_path"]
                result = extend_image(path, final_path)
            elif data["id"] == "other--other--num-den":
                result = other_NumDenStart(data, up2)

            response_data = {"req_id": req_id, "result": result}

            print(json.dumps(response_data, ensure_ascii=False), flush=True)

        except Exception as e:
            error_data = {
                "req_id": (
                    raw_request.get("req_id")
                    if "raw_request" in locals() and isinstance(raw_request, dict)
                    else None
                ),
                "result": None,
                "error": str(e),
                "traceback": traceback.format_exc(),
            }
            print(json.dumps(error_data, ensure_ascii=False), flush=True)
