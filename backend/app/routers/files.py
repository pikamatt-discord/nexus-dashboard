from fastapi import APIRouter, Depends, HTTPException, Query, status
from ..security import get_current_user, User
from ..file_service import list_directory, read_file_content

router = APIRouter(prefix="/files", tags=["Files"])

@router.get("/browse")
def browse_files(
    path: str = Query("/", description="Absolute path to browse"),
    current_user: User = Depends(get_current_user)
):
    try:
        return list_directory(path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.get("/content")
def get_file_content(
    path: str = Query(..., description="Absolute path to text file"),
    current_user: User = Depends(get_current_user)
):
    try:
        return read_file_content(path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
